import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

const MessagingResponse = twilio.twiml.MessagingResponse;

// GET handler for Twilio webhook validation
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Leaderboards SMS webhook is active"
  }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = (formData.get("Body") as string)?.trim();

    console.log("Leaderboards SMS received from:", from, "Body:", body);

    // Extract phone number (remove +1 prefix)
    const phoneNumber = from?.replace("+1", "");
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
        "Welcome to Leaderboards!\n\n" +
        "Your phone number is not registered. Please contact your supervisor to be added to the system.\n\n" +
        "Bienvenido a Leaderboards! Su número no está registrado. Contacte a su supervisor."
      );
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" }
      });
    }

    const upperBody = body?.toUpperCase() || "";
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Handle commands
    switch (upperBody) {
      case "IN":
      case "CLOCK IN": {
        if (worker.timeEntries.length > 0) {
          twiml.message(
            "⏰ Already clocked in!\n" +
            "Text OUT when you're done.\n\n" +
            "Ya está registrado. Envíe OUT cuando termine."
          );
        } else {
          await prisma.timeEntry.create({
            data: {
              workerId: worker.id,
              clockIn: now,
              location: worker.assignments[0]?.dispatchGroup.location
            }
          });

          const timeString = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          twiml.message(
            `✅ Clocked in at ${timeString}\n` +
            `Worker: ${worker.name}\n` +
            `Role: ${worker.role}\n\n` +
            `Have a productive day! Text OUT when done.`
          );
        }
        break;
      }

      case "OUT":
      case "CLOCK OUT": {
        const openEntry = worker.timeEntries[0];

        if (!openEntry) {
          twiml.message(
            "❌ Not clocked in yet.\n" +
            "Text IN to start your shift.\n\n" +
            "No ha registrado entrada. Envíe IN para comenzar."
          );
        } else {
          const hours = ((now.getTime() - openEntry.clockIn.getTime()) / (1000 * 60 * 60)).toFixed(1);

          await prisma.timeEntry.update({
            where: { id: openEntry.id },
            data: { clockOut: now }
          });

          const timeString = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          twiml.message(
            `✅ Clocked out at ${timeString}\n` +
            `⏱️ Today: ${hours} hours\n\n` +
            `Great work, ${worker.name}! See you tomorrow.`
          );
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
            const hours = (now.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
            todayHours += hours;
            totalHours += hours;
          }
        });

        const isClocked = worker.timeEntries.length > 0;

        twiml.message(
          `📊 LEADERBOARDS TIME REPORT\n` +
          `Worker: ${worker.name}\n\n` +
          `Today: ${todayHours.toFixed(1)} hrs\n` +
          `This Week: ${totalHours.toFixed(1)} hrs\n\n` +
          `Status: ${isClocked ? '🟢 Clocked In' : '⭕ Not Clocked In'}`
        );
        break;
      }

      case "STATUS": {
        // Check for dispatch assignment first
        const dispatchWorker = await prisma.dispatchWorker.findFirst({
          where: { phone: phoneNumber }
        });

        if (dispatchWorker && dispatchWorker.userId) {
          const dispatchAssignment = await prisma.dispatchAssignment.findFirst({
            where: {
              userId: dispatchWorker.userId,
              date: {
                gte: today,
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
              }
            },
            include: {
              group: true
            }
          });

          if (dispatchAssignment) {
            twiml.message(
              `📍 LEADERBOARDS DISPATCH\n\n` +
              `Worker: ${worker.name}\n` +
              `Project: ${dispatchAssignment.group.name}\n` +
              `Location: ${dispatchAssignment.group.location || 'TBD'}\n` +
              `Time: ${dispatchAssignment.group.startTime}\n` +
              `Status: ${dispatchAssignment.status}`
            );
            break;
          }
        }

        // Fall back to worker assignments
        const assignment = worker.assignments[0];
        if (assignment) {
          twiml.message(
            `📍 LEADERBOARDS DISPATCH\n\n` +
            `Worker: ${worker.name}\n` +
            `Project: ${assignment.dispatchGroup.name}\n` +
            `Location: ${assignment.dispatchGroup.location || 'TBD'}\n` +
            `Time: ${assignment.dispatchGroup.time}\n` +
            `Team: ${worker.team?.name || 'No team'}`
          );
        } else {
          twiml.message(
            `LEADERBOARDS: No assignment today.\n` +
            `Contact your supervisor if this is an error.`
          );
        }
        break;
      }

      case "HELP":
      case "INFO":
      case "?": {
        twiml.message(
          `🏗️ LEADERBOARDS COMMANDS\n\n` +
          `IN - Clock in\n` +
          `OUT - Clock out\n` +
          `HOURS - View your hours\n` +
          `STATUS - Today's assignment\n` +
          `HELP - Show this menu\n\n` +
          `Questions? Contact dispatch.`
        );
        break;
      }

      default: {
        twiml.message(
          `Leaderboards received: "${body}"\n\n` +
          `Text HELP for commands.\n` +
          `Envíe HELP para comandos.`
        );
      }
    }

    console.log("Leaderboards response:", twiml.toString());

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" }
    });

  } catch (error) {
    console.error("Leaderboards SMS webhook error:", error);
    const twiml = new MessagingResponse();
    twiml.message(
      "Leaderboards Error: Please try again or contact support."
    );

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" }
    });
  }
}