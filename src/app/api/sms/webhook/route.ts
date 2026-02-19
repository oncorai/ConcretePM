import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import {
  notifyManagersOfDecline,
  checkAndNotifyFullCrewConfirmed
} from "@/lib/dispatch-notifications";
import { processEndOfDay } from "@/lib/end-of-day-processor";

const MessagingResponse = twilio.twiml.MessagingResponse;

// Calculate distance between two GPS coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Get category name from code prefix
function getCategoryName(prefix: string): string {
  const categories: Record<string, string> = {
    '01': 'GENERAL CONDITIONS',
    '02': 'FOUNDATION',
    '03': 'CONCRETE',
    '04': 'MASONRY',
    '05': 'METALS',
    '06': 'WOOD & PLASTICS',
    '07': 'THERMAL & MOISTURE',
    '08': 'DOORS & WINDOWS',
    '09': 'FINISHES',
    '10': 'SPECIALTIES',
    '11': 'EQUIPMENT',
    '12': 'FURNISHINGS',
    '13': 'SPECIAL CONSTRUCTION',
    '14': 'CONVEYING SYSTEMS',
    '15': 'PLUMBING',
    '16': 'ELECTRICAL',
    '21': 'FIRE SUPPRESSION',
    '22': 'PLUMBING',
    '23': 'HVAC',
    '26': 'ELECTRICAL',
    '31': 'EARTHWORK',
    '32': 'EXTERIOR IMPROVEMENTS',
    '33': 'UTILITIES'
  };
  return categories[prefix] || `DIVISION ${prefix}`;
}

// GET handler for Twilio webhook validation
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = (formData.get("Body") as string)?.trim();
    const mediaUrl = formData.get("MediaUrl0") as string;

    console.log("SMS received from:", from, "Body:", body);

    // Extract phone number (remove +1 prefix)
    const phoneNumber = from.replace("+1", "");
    const twiml = new MessagingResponse();

    // Check if this is from a worker
    const worker = await prisma.worker.findFirst({
      where: { phoneNumber },
      include: {
        team: true,
        assignments: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          },
          include: { dispatchGroup: true }
        },
        timeEntries: {
          where: {
            clockIn: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            },
            clockOut: null
          }
        }
      }
    });

    if (!worker) {
      twiml.message(
        "Your phone number is not registered. Please contact your supervisor.\n\n" +
        "Su número no está registrado. Por favor contacte a su supervisor."
      );
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" }
      });
    }

    const upperBody = body.toUpperCase();
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Handle commands
    switch (upperBody) {
      case "IN":
      case "CLOCK IN": {
        if (worker.timeEntries.length > 0) {
          twiml.message(
            "You're already clocked in. Text OUT when you're done for the day.\n\n" +
            "Ya está registrado. Envíe OUT cuando termine el día."
          );
        } else {
          // Check if photo was sent with message
          let photoVerified = false;
          if (mediaUrl) {
            // Store the photo URL for verification
            // In production, this would be sent to an AI service for verification
            photoVerified = true; // For now, any photo counts as verification

            // Store photo URL for superintendent review - ClockInPhoto model doesn't exist
            // await prisma.clockInPhoto.create({
            //   data: {
            //     workerId: worker.id,
            //     photoUrl: mediaUrl,
            //     timestamp: now,
            //     projectId: worker.assignments[0]?.dispatchGroup.projectId
            //   }
            // });
          }

          await prisma.timeEntry.create({
            data: {
              workerId: worker.id,
              clockIn: now,
              location: worker.assignments[0]?.dispatchGroup.location
              // photoVerified field doesn't exist in TimeEntry
            }
          });

          const assignment = worker.assignments[0];
          const timeString = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          if (assignment) {
            let message = `✅ Clocked in at ${timeString}\n` +
              `📍 ${assignment.dispatchGroup.name}\n` +
              `${assignment.dispatchGroup.location || ''}\n`;

            if (photoVerified) {
              message += `📸 Photo received\n`;
            } else {
              message += `📸 Send a photo of job site next time\n`;
            }

            message += `Text OUT when done.\n\n` +
              `✅ Entrada a las ${timeString}\n` +
              `📍 ${assignment.dispatchGroup.name}\n` +
              `${assignment.dispatchGroup.location || ''}\n`;

            if (photoVerified) {
              message += `📸 Foto recibida\n`;
            } else {
              message += `📸 Envíe una foto del sitio la próxima vez\n`;
            }

            message += `Envíe OUT cuando termine.`;

            twiml.message(message);
          } else {
            twiml.message(
              `✅ Clocked in at ${timeString}\n` +
              `${photoVerified ? '📸 Photo received\n' : '📸 Send a photo next time\n'}` +
              `Text OUT when done.\n\n` +
              `✅ Entrada a las ${timeString}\n` +
              `${photoVerified ? '📸 Foto recibida\n' : '📸 Envíe una foto la próxima vez\n'}` +
              `Envíe OUT cuando termine.`
            );
          }
        }
        break;
      }

      case "OUT":
      case "CLOCK OUT": {
        const openEntry = worker.timeEntries[0];

        if (!openEntry) {
          twiml.message(
            "You haven't clocked in today. Text IN to start your shift.\n\n" +
            "No ha registrado entrada hoy. Envíe IN para comenzar su turno."
          );
        } else {
          const hours = ((now.getTime() - openEntry.clockIn.getTime()) / (1000 * 60 * 60)).toFixed(1);

          // Update time entry
          await prisma.timeEntry.update({
            where: { id: openEntry.id },
            data: { clockOut: now }
          });

          const timeString = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          // Simple response to worker
          twiml.message(
            `✅ Clocked out at ${timeString}\n` +
            `⏱️ Today: ${hours} hours\n` +
            `Great work! See you tomorrow.\n\n` +
            `✅ Salida a las ${timeString}\n` +
            `⏱️ Hoy: ${hours} horas\n` +
            `¡Buen trabajo! Hasta mañana.`
          );

          // Mark assignment as completed
          if (worker.assignments[0]) {
            await prisma.workerAssignment.update({
              where: { id: worker.assignments[0].id },
              data: { status: "completed" }
            });

            // Trigger end-of-day processing to check if all workers are done
            // This will send cost coding request to super/PM
            await processEndOfDay(
              worker.assignments[0].dispatchGroupId,
              worker.id,
              now,
              parseFloat(hours),
              today
            );
          }
        }
        break;
      }

      case "HOURS":
      case "TIME": {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        const weekEntries = await prisma.timeEntry.findMany({
          where: {
            workerId: worker.id,
            clockIn: { gte: weekStart }
          }
        });

        let totalHours = 0;
        let todayHours = 0;

        weekEntries.forEach(entry => {
          if (entry.clockOut) {
            const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
            totalHours += hours;
            if (entry.clockIn >= today) {
              todayHours += hours;
            }
          } else if (entry.clockIn >= today) {
            // Currently clocked in today
            const hours = (now.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
            todayHours += hours;
            totalHours += hours;
          }
        });

        const isClocked = worker.timeEntries.length > 0;

        twiml.message(
          `📊 Your Hours\n\n` +
          `Today: ${todayHours.toFixed(1)} hrs\n` +
          `This week: ${totalHours.toFixed(1)} hrs\n` +
          `Status: ${isClocked ? '🟢 Clocked in' : '⭕ Not clocked in'}\n\n` +
          `📊 Sus Horas\n\n` +
          `Hoy: ${todayHours.toFixed(1)} hrs\n` +
          `Esta semana: ${totalHours.toFixed(1)} hrs\n` +
          `Estado: ${isClocked ? '🟢 Registrado' : '⭕ No registrado'}`
        );
        break;
      }

      case "STATUS":
      case "TODAY": {
        const assignment = worker.assignments[0];
        if (assignment) {
          twiml.message(
            `📍 Today's Assignment\n\n` +
            `Project: ${assignment.dispatchGroup.name}\n` +
            `Location: ${assignment.dispatchGroup.location || 'TBD'}\n` +
            `Report Time: ${assignment.dispatchGroup.time}\n` +
            `Team: ${worker.team?.name || 'No team assigned'}\n\n` +
            `📍 Asignación de Hoy\n\n` +
            `Proyecto: ${assignment.dispatchGroup.name}\n` +
            `Ubicación: ${assignment.dispatchGroup.location || 'Por confirmar'}\n` +
            `Hora: ${assignment.dispatchGroup.time}\n` +
            `Equipo: ${worker.team?.name || 'Sin equipo asignado'}`
          );
        } else {
          twiml.message(
            "No assignment for today. Contact your supervisor if this is an error.\n\n" +
            "Sin asignación para hoy. Contacte a su supervisor si esto es un error."
          );
        }
        break;
      }

      case "YES":
      case "Y":
      case "SI":
      case "SÍ":
      case "CONFIRM":
      case "CONFIRMAR": {
        // Save message to database
        await prisma.message.create({
          data: {
            workerId: worker.id,
            content: body,
            recipientPhone: worker.phoneNumber,
            recipientName: worker.name,
            status: "DELIVERED",
            sentAt: now
          }
        });

        // Look for tomorrow's assignment
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tomorrowAssignment = await prisma.workerAssignment.findFirst({
          where: {
            workerId: worker.id,
            date: {
              gte: tomorrow,
              lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
            },
            status: "pending"
          },
          include: { dispatchGroup: true }
        });

        if (tomorrowAssignment) {
          await prisma.workerAssignment.update({
            where: { id: tomorrowAssignment.id },
            data: { status: "confirmed" }
          });

          twiml.message(
            `✅ Confirmed for tomorrow\n\n` +
            `📍 ${tomorrowAssignment.dispatchGroup.name}\n` +
            `${tomorrowAssignment.dispatchGroup.location || 'TBD'}\n` +
            `🕐 ${tomorrowAssignment.dispatchGroup.time}\n\n` +
            `✅ Confirmado para mañana\n\n` +
            `📍 ${tomorrowAssignment.dispatchGroup.name}\n` +
            `${tomorrowAssignment.dispatchGroup.location || 'Por confirmar'}\n` +
            `🕐 ${tomorrowAssignment.dispatchGroup.time}`
          );

          // Check if full crew is confirmed and notify managers
          await checkAndNotifyFullCrewConfirmed(
            tomorrowAssignment.dispatchGroupId
          );
        } else {
          twiml.message(
            "No pending assignment to confirm.\n\n" +
            "Sin asignación pendiente para confirmar."
          );
        }
        break;
      }

      case "NO":
      case "N":
      case "CANT":
      case "RECHAZAR":
      case "CANCELAR": {
        // Save message to database
        await prisma.message.create({
          data: {
            workerId: worker.id,
            content: body,
            recipientPhone: worker.phoneNumber,
            recipientName: worker.name,
            status: "DELIVERED",
            sentAt: now
          }
        });

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tomorrowAssignment = await prisma.workerAssignment.findFirst({
          where: {
            workerId: worker.id,
            date: {
              gte: tomorrow,
              lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
            },
            status: "pending"
          }
        });

        if (tomorrowAssignment) {
          await prisma.workerAssignment.update({
            where: { id: tomorrowAssignment.id },
            data: { status: "declined" }
          });

          twiml.message(
            "❌ Assignment declined. Your supervisor will be notified.\n\n" +
            "❌ Asignación rechazada. Su supervisor será notificado."
          );

          // Notify PM and Super about the decline
          await notifyManagersOfDecline(
            worker.id,
            tomorrowAssignment.id
          );
        } else {
          twiml.message(
            "No pending assignment to decline.\n\n" +
            "Sin asignación pendiente para rechazar."
          );
        }
        break;
      }

      case "CODES":
      case "CODE":
      case "COSTCODES": {
        // This command is for superintendents and PMs
        const workerRole = worker.role?.toLowerCase();
        if (workerRole !== 'superintendent' && workerRole !== 'project manager') {
          twiml.message(
            `This command is only available for superintendents and project managers.\n\n` +
            `Text HELP for available commands.`
          );
        } else {
          // Get the actual project linked through dispatch
          const assignment = worker.assignments[0];
          if (!assignment?.dispatchGroup.projectId) {
            twiml.message(`No project assigned. Contact dispatch.`);
            break;
          }

          // Get the project with its phases
          const project = await prisma.project.findUnique({
            where: { id: assignment.dispatchGroup.projectId },
            include: {
              phases: {
                orderBy: { name: 'asc' }
              }
            }
          });

          if (!project) {
            twiml.message(`Project not found. Contact dispatch.`);
            break;
          }

          if (project.phases.length === 0) {
            twiml.message(
              `No phases set up for ${project.name}.\n\n` +
              `Please set up project phases in the dashboard first.`
            );
          } else {
            // Show list of phases to choose from
            let message = `📋 ${project.name} - PHASES\n\n`;
            message += `Select a phase to see cost codes:\n\n`;

            project.phases.forEach((phase, index) => {
              message += `${index + 1}. ${phase.name}\n`;
            });

            message += `\nText the phase name or number to see its codes.\n`;
            message += `Example: "Foundation" or "2"`;

            twiml.message(message);
          }
        }
        break;
      }

      case "TEAM":
      case "COMMANDS":
      case "MENU": {
        const workerRole = worker.role?.toLowerCase();

        // Different messages for super/PM vs regular workers
        if (workerRole === 'superintendent' || workerRole === 'project manager') {
          const commands = `📱 Commands:\n\n` +
            `IN - Clock in\n` +
            `OUT - Clock out\n` +
            `HOURS - View hours\n` +
            `STATUS - Today's assignment\n` +
            `YES/NO - Confirm/decline\n` +
            `CODES - View cost codes\n` +
            `TEAM - Show commands`;

          twiml.message(commands);
        } else {
          // Regular workers get bilingual version
          const commands = `📱 Commands:\n\n` +
            `IN - Clock in\n` +
            `OUT - Clock out\n` +
            `HOURS - View hours\n` +
            `STATUS - Today's assignment\n` +
            `YES/NO - Confirm/decline\n` +
            `TEAM - Show commands\n\n` +
            `📱 Comandos:\n\n` +
            `IN - Entrada\n` +
            `OUT - Salida\n` +
            `HOURS - Ver horas\n` +
            `STATUS - Asignación de hoy\n` +
            `YES/NO - Confirmar/rechazar\n` +
            `TEAM - Ver comandos`;

          twiml.message(commands);
        }

        break;
      }

      case "HELP":
      case "INFO":
      case "?": {
        const workerRole = worker.role?.toLowerCase();
        let commands = `📱 Commands / Comandos:\n\n` +
          `IN - Clock in / Entrada\n` +
          `OUT - Clock out / Salida\n` +
          `HOURS - View hours / Ver horas\n` +
          `STATUS - Today's assignment / Asignación de hoy\n` +
          `YES/NO - Confirm/decline / Confirmar/rechazar\n`;

        // Add CODES command for super/PM
        if (workerRole === 'superintendent' || workerRole === 'project manager') {
          commands += `CODES - View cost codes\n`;
        }

        commands += `TEAM - Show commands / Ver comandos`;

        twiml.message(commands);
        break;
      }

      default: {
        // Check if super/PM is asking for specific phase codes
        const workerRole = worker.role?.toLowerCase();
        if (workerRole === 'superintendent' || workerRole === 'project manager') {
          const assignment = worker.assignments[0];
          if (assignment?.dispatchGroup.projectId) {
            // Get project with all phases to check if message matches a phase name or number
            const project = await prisma.project.findUnique({
              where: { id: assignment.dispatchGroup.projectId },
              include: {
                phases: {
                  orderBy: { name: 'asc' },
                  include: {
                    subPhases: {
                      orderBy: { name: 'asc' }
                    }
                  }
                }
              }
            });

            if (project && project.phases.length > 0) {
              let matchedPhase = null;

              // Check if it's a number (phase index)
              const phaseNumber = parseInt(body.trim());
              if (!isNaN(phaseNumber) && phaseNumber > 0 && phaseNumber <= project.phases.length) {
                matchedPhase = project.phases[phaseNumber - 1];
              } else {
                // Check if the message matches any phase name
                matchedPhase = project.phases.find(phase =>
                  phase.name.toLowerCase() === body.toLowerCase() ||
                  phase.name.toLowerCase().includes(body.toLowerCase()) ||
                  body.toLowerCase().includes(phase.name.toLowerCase())
                );
              }

              if (matchedPhase) {
                let message = `📋 ${matchedPhase.name.toUpperCase()}\n`;
                message += `${project.name}\n\n`;

                if (matchedPhase.subPhases.length === 0) {
                  message += `No subphases/codes set up for this phase.\n`;
                  message += `Please add them in the project dashboard.`;
                } else {
                  message += `COST CODES:\n\n`;

                  for (const subPhase of matchedPhase.subPhases) {
                    // Only show subphases that have a cost code
                    if (subPhase.costCode) {
                      message += `${subPhase.costCode} - ${subPhase.name}`;
                      // Add unit of measure if available
                      if (subPhase.unit) {
                        message += ` (${subPhase.unit})`;
                      }
                      message += `\n`;
                    }
                  }

                  message += `\n━━━━━━━━━━\n`;
                  message += `Format: CODE HOURS QTY\n`;
                  message += `Example: ${matchedPhase.subPhases[0]?.costCode || '031010'} 8.5 250\n\n`;
                  message += `Text CODES to see all phases`;
                }

                twiml.message(message);
                break;
              }
            }
          }
        }

        // Check if this is a cost coding response from super/PM - CostCodingSession model doesn't exist
        // const activeSession = await prisma.costCodingSession.findFirst({
        //   where: {
        //     recipientPhone: phoneNumber,
        //     status: 'pending'
        //   }
        // });

        // if (activeSession) {
        //   // Parse cost code response
        //   // Expected format: "CODE HOURS QUANTITY" (one or multiple lines)
        //   const lines = body.trim().split('\n');
        //   const costCodes: Array<{ code: string; hours: number; quantity: number }> = [];
        //   const lunchAnswers: boolean[] = [];

        //   for (const line of lines) {
        //     const trimmed = line.trim().toUpperCase();

        //     // Check for lunch answers (Y/N)
        //     if (trimmed === 'Y' || trimmed === 'YES') {
        //       lunchAnswers.push(true);
        //     } else if (trimmed === 'N' || trimmed === 'NO') {
        //       lunchAnswers.push(false);
        //     } else {
        //       // Parse cost code
        //       const parts = trimmed.split(/\s+/);
        //       if (parts.length >= 3) {
        //         const code = parts[0];
        //         const hours = parseFloat(parts[1]);
        //         const quantity = parseFloat(parts[2]);

        //         if (!isNaN(hours) && !isNaN(quantity)) {
        //           costCodes.push({ code, hours, quantity });
        //         }
        //       }
        //     }
        //   }

        //   if (costCodes.length > 0) {
        //     // Process the cost codes
        //     const { processCostCodeResponse } = await import('@/lib/end-of-day-processor');
        //     await processCostCodeResponse(
        //       activeSession.id,
        //       costCodes,
        //       lunchAnswers.length > 0 ? lunchAnswers : undefined
        //     );

        //     twiml.message(
        //       `✅ Cost codes received and processed.\n\n` +
        //       `Daily report has been generated.\n` +
        //       `PM has been notified for approval.`
        //     );
        //   } else {
        //     twiml.message(
        //       `❌ Invalid format. Please use:\n` +
        //       `CODE HOURS QUANTITY\n\n` +
        //       `Example:\n` +
        //       `F101 25.5 150\n` +
        //       `F201 12.0 200`
        //     );
        //   }
        // } else {
        if (true) { // Always do this for now
          // Save as a general message for dispatch conversations
          await prisma.message.create({
            data: {
              workerId: worker.id,
              content: body,
              recipientPhone: worker.phoneNumber,
              recipientName: worker.name,
              status: "DELIVERED",
              sentAt: now
            }
          });

          // Also check for dispatch confirmation responses
          if (upperBody === "1" || upperBody === "ACCEPT") {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const assignment = await prisma.workerAssignment.findFirst({
              where: {
                workerId: worker.id,
                date: {
                  gte: tomorrow,
                  lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
                },
                status: "pending"
              },
              include: { dispatchGroup: true }
            });

            if (assignment) {
              await prisma.workerAssignment.update({
                where: { id: assignment.id },
                data: { status: "confirmed" }
              });

              twiml.message(
                `✅ Confirmed for tomorrow / Confirmado para mañana\n\n` +
                `📍 ${assignment.dispatchGroup.name}\n` +
                `${assignment.dispatchGroup.location || 'TBD'}\n` +
                `🕐 ${assignment.dispatchGroup.time}`
              );

              // Check if full crew is confirmed and notify managers
              await checkAndNotifyFullCrewConfirmed(
                assignment.dispatchGroupId
              );
            } else {
              twiml.message(
                `Message received: "${body}"\n\n` +
                `Text INFO for available commands.`
              );
            }
          } else if (upperBody === "2" || upperBody === "DECLINE") {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const assignment = await prisma.workerAssignment.findFirst({
            where: {
              workerId: worker.id,
              date: {
                gte: tomorrow,
                lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
              },
              status: "pending"
            }
          });

          if (assignment) {
            await prisma.workerAssignment.update({
              where: { id: assignment.id },
              data: { status: "declined" }
            });

            twiml.message(
              "❌ Assignment declined. Your supervisor will be notified.\n\n" +
              "❌ Asignación rechazada. Su supervisor será notificado."
            );

            // Notify PM and Super about the decline
            await notifyManagersOfDecline(
              worker.id,
              assignment.id
            );
          } else {
            twiml.message(
              `Message received: "${body}"\n\n` +
              `Text INFO for available commands.`
            );
          }
        } else {
          // Just acknowledge the message
          twiml.message(
            `Message received: "${body}"\n\n` +
            `Text INFO for available commands.`
          );
        }
      }
    }
  }

    console.log("Response:", twiml.toString());

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" }
    });

  } catch (error) {
    console.error("SMS webhook error:", error);
    const twiml = new MessagingResponse();
    twiml.message(
      "Sorry, something went wrong. Please try again or contact support.\n\n" +
      "Lo sentimos, algo salió mal. Por favor intente de nuevo o contacte soporte."
    );

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" }
    });
  }
}