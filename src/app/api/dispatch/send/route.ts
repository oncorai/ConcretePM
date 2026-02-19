import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendDispatchNotification,
  formatPhoneForTwilio,
  twilioClient,
} from "@/lib/twilio";

interface Worker {
  id: string;
  name: string;
  phone: string;
  workerRole: string;
  status?: string;
}

interface CrewTime {
  name?: string;
  time: string;
  workers: Worker[];
}

interface Group {
  id: string;
  name: string;
  location?: string;
  startTime: string;
  projectManager?: Worker | null;
  superintendent?: Worker | null;
  workers: Worker[];
  crewTimes?: CrewTime[];
}

// Helper function to build crew list message
function buildCrewListMessage(
  recipientName: string,
  recipientRole: string,
  groups: Group[],
  date: Date
): string {
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // For Project Managers - show all their projects
  if (recipientRole.toLowerCase() === 'project manager') {
    let message = `Hi ${recipientName}, here's your crew list for ${dateStr}:\n\n`;

    groups.forEach(group => {
      message += `📍 ${group.name}`;
      if (group.location) message += ` (${group.location})`;
      message += `\n⏰ ${group.startTime}\n`;

      // Add superintendent if exists
      if (group.superintendent) {
        message += `Super: ${group.superintendent.name}\n`;
      }

      // Count total workers
      let totalWorkers = group.workers.length;
      if (group.crewTimes) {
        group.crewTimes.forEach(ct => {
          totalWorkers += ct.workers?.length || 0;
        });
      }

      message += `Crew: ${totalWorkers} workers\n`;

      // List main crew
      if (group.workers.length > 0) {
        message += `Main (${group.startTime}): `;
        message += group.workers.slice(0, 3).map(w => w.name.split(' ')[0]).join(', ');
        if (group.workers.length > 3) message += ` +${group.workers.length - 3} more`;
        message += '\n';
      }

      // List crew times
      if (group.crewTimes) {
        group.crewTimes.forEach(ct => {
          if (ct.workers?.length > 0) {
            message += `${ct.time}: `;
            message += ct.workers.slice(0, 3).map(w => w.name.split(' ')[0]).join(', ');
            if (ct.workers.length > 3) message += ` +${ct.workers.length - 3} more`;
            message += '\n';
          }
        });
      }

      message += '\n';
    });

    return message.trim();
  }

  // For Superintendents - detailed list of their project
  if (recipientRole.toLowerCase() === 'superintendent') {
    const group = groups[0]; // Supers usually have one project
    let message = `Hi ${recipientName}, crew list for ${group.name} on ${dateStr}:\n\n`;

    if (group.location) message += `📍 ${group.location}\n`;
    message += `⏰ Start: ${group.startTime}\n\n`;

    // List all workers with roles
    message += `CREW LIST:\n`;

    // Main crew
    if (group.workers.length > 0) {
      message += `Main Crew (${group.startTime}):\n`;
      group.workers.forEach(w => {
        message += `• ${w.name}`;
        if (w.workerRole) message += ` (${w.workerRole})`;
        message += '\n';
      });
    }

    // Crew times
    if (group.crewTimes) {
      group.crewTimes.forEach(ct => {
        if (ct.workers?.length > 0) {
          message += `\n${ct.name || ct.time} Crew:\n`;
          ct.workers.forEach(w => {
            message += `• ${w.name}`;
            if (w.workerRole) message += ` (${w.workerRole})`;
            message += '\n';
          });
        }
      });
    }

    // Total count
    let totalWorkers = group.workers.length;
    if (group.crewTimes) {
      group.crewTimes.forEach(ct => {
        totalWorkers += ct.workers?.length || 0;
      });
    }
    message += `\nTotal: ${totalWorkers} workers`;

    return message.trim();
  }

  // Default message for other roles
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date: dateStr, groups } = await request.json();

    if (!dateStr || !groups) {
      return NextResponse.json(
        { error: "Date and groups are required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const sentMessages = [];
    const errors = [];

    // First, collect all Project Managers and their projects
    const pmProjects = new Map<string, Group[]>();
    const superProjects = new Map<string, Group[]>();

    for (const group of groups) {
      // Collect PM's projects
      if (group.projectManager) {
        const pmId = group.projectManager.id;
        if (!pmProjects.has(pmId)) {
          pmProjects.set(pmId, []);
        }
        pmProjects.get(pmId)!.push(group);
      }

      // Collect Superintendent's projects
      if (group.superintendent) {
        const superId = group.superintendent.id;
        if (!superProjects.has(superId)) {
          superProjects.set(superId, []);
        }
        superProjects.get(superId)!.push(group);
      }
    }

    // Send crew lists to Project Managers
    for (const [pmId, pmGroups] of pmProjects) {
      const pm = pmGroups[0].projectManager!;
      if (!pm.phone) {
        errors.push({
          workerId: pm.id,
          error: "Project Manager has no phone number",
        });
        continue;
      }

      try {
        const formattedPhone = formatPhoneForTwilio(pm.phone);
        const message = buildCrewListMessage(pm.name, 'project manager', pmGroups, date);

        if (twilioClient && message) {
          const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone,
          });

          sentMessages.push({
            workerId: pm.id,
            status: "sent",
            messageSid: twilioMessage.sid,
            role: "Project Manager",
          });

          console.log(`[SMS] Sent crew list to PM ${pm.name}`);
        } else {
          console.log(`[SMS Mock] PM ${pm.name} crew list:\n${message}`);
          sentMessages.push({
            workerId: pm.id,
            status: "mock",
            role: "Project Manager",
          });
        }
      } catch (error) {
        console.error(`Failed to send SMS to PM ${pm.name}:`, error);
        errors.push({
          workerId: pm.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Send crew lists to Superintendents
    for (const [superId, superGroups] of superProjects) {
      const superintendent = superGroups[0].superintendent!;
      if (!superintendent.phone) {
        errors.push({
          workerId: superintendent.id,
          error: "Superintendent has no phone number",
        });
        continue;
      }

      try {
        const formattedPhone = formatPhoneForTwilio(superintendent.phone);
        const message = buildCrewListMessage(superintendent.name, 'superintendent', superGroups, date);

        if (twilioClient && message) {
          const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone,
          });

          sentMessages.push({
            workerId: superintendent.id,
            status: "sent",
            messageSid: twilioMessage.sid,
            role: "Superintendent",
          });

          console.log(`[SMS] Sent crew list to Super ${superintendent.name}`);
        } else {
          console.log(`[SMS Mock] Super ${superintendent.name} crew list:\n${message}`);
          sentMessages.push({
            workerId: superintendent.id,
            status: "mock",
            role: "Superintendent",
          });
        }
      } catch (error) {
        console.error(`Failed to send SMS to Super ${superintendent.name}:`, error);
        errors.push({
          workerId: superintendent.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Send individual notifications to regular crew members
    for (const group of groups) {
      // Send to workers directly assigned to the group
      for (const worker of group.workers) {
        // Skip if this is a PM or Super (they already got their messages)
        const role = worker.workerRole?.toLowerCase();
        if (role === 'project manager' || role === 'superintendent') {
          continue;
        }

        if (!worker.phone) {
          errors.push({
            workerId: worker.id,
            error: "No phone number",
          });
          continue;
        }

        try {
          const formattedPhone = formatPhoneForTwilio(worker.phone);

          // Send SMS if Twilio is configured
          if (twilioClient) {
            const message = await sendDispatchNotification(
              formattedPhone,
              worker.name,
              group.name,
              group.location,
              group.startTime,
              date,
              null // No crew time for direct assignment
            );

            if (message) {
              sentMessages.push({
                workerId: worker.id,
                status: "sent",
                messageSid: message.sid,
                role: worker.workerRole,
              });
            }
          } else {
            // In development without Twilio, just log
            console.log(`[SMS Mock] To ${worker.name} (${worker.workerRole}): Dispatch to ${group.name} at ${group.startTime}`);
            sentMessages.push({
              workerId: worker.id,
              status: "mock",
              role: worker.workerRole,
            });
          }
        } catch (error) {
          console.error(`Failed to send SMS to ${worker.name}:`, error);
          errors.push({
            workerId: worker.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Send to workers in crew times
      if (group.crewTimes) {
        for (const crewTime of group.crewTimes) {
          for (const worker of crewTime.workers || []) {
            // Skip if this is a PM or Super
            const role = worker.workerRole?.toLowerCase();
            if (role === 'project manager' || role === 'superintendent') {
              continue;
            }

            if (!worker.phone) {
              errors.push({
                workerId: worker.id,
                error: "No phone number",
              });
              continue;
            }

            try {
              const formattedPhone = formatPhoneForTwilio(worker.phone);

              // Send SMS if Twilio is configured
              if (twilioClient) {
                const message = await sendDispatchNotification(
                  formattedPhone,
                  worker.name,
                  group.name,
                  group.location,
                  crewTime.time, // Use crew time instead of group start time
                  date,
                  crewTime.name // Include crew name
                );

                if (message) {
                  sentMessages.push({
                    workerId: worker.id,
                    status: "sent",
                    messageSid: message.sid,
                    role: worker.workerRole,
                  });
                }
              } else {
                // In development without Twilio, just log
                console.log(`[SMS Mock] To ${worker.name} (${worker.workerRole}): Dispatch to ${group.name} at ${crewTime.time}`);
                sentMessages.push({
                  workerId: worker.id,
                  status: "mock",
                  role: worker.workerRole,
                });
              }
            } catch (error) {
              console.error(`Failed to send SMS to ${worker.name}:`, error);
              errors.push({
                workerId: worker.id,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }
        }
      }
    }

    console.log(`Dispatch SMS Summary: ${sentMessages.length} sent, ${errors.length} errors`);
    console.log('Sent to:', sentMessages.map(m => m.role).filter((v, i, a) => a.indexOf(v) === i));

    return NextResponse.json({
      success: true,
      sent: sentMessages.length,
      errors: errors.length,
      details: {
        sentMessages,
        errors,
      },
    });
  } catch (error) {
    console.error("Failed to send dispatch notifications:", error);
    return NextResponse.json(
      { error: "Failed to send dispatch notifications" },
      { status: 500 }
    );
  }
}