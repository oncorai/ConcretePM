import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

// Dispatcher phone number - add this to .env.local
const DISPATCHER_PHONE = process.env.DISPATCHER_PHONE_NUMBER || "";

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook data
    const formData = await request.formData();
    const from = formData.get("From") as string;
    const body = (formData.get("Body") as string)?.trim().toUpperCase();
    const messageSid = formData.get("MessageSid") as string;

    console.log("Received SMS:", { from, body, messageSid });

    // Find worker by phone number
    const worker = await prisma.dispatchWorker.findFirst({
      where: {
        phone: {
          contains: from.replace(/\D/g, "").slice(-10), // Match last 10 digits
        },
      },
    });

    if (!worker) {
      console.log("Unknown number:", from);

      // Notify dispatcher of unknown number
      if (DISPATCHER_PHONE) {
        await sendSMS(
          DISPATCHER_PHONE,
          `Unknown number texted dispatch: ${from}\nMessage: ${body}`
        );
      }

      return NextResponse.json({ success: true });
    }

    // Find their latest assignment for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create userId for the worker
    let userId = worker.userId;
    if (!userId) {
      // Create a User for this worker if they don't have one
      const user = await prisma.user.create({
        data: {
          name: worker.name,
          email: `${worker.phone}@dispatch.local`,
          password: 'dispatch123',
          phone: worker.phone,
          role: 'worker'
        }
      });

      // Update the worker with the new userId
      await prisma.dispatchWorker.update({
        where: { id: worker.id },
        data: { userId: user.id }
      });

      userId = user.id;
    }

    const assignment = await prisma.dispatchAssignment.findFirst({
      where: {
        userId: userId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Handle YES/NO responses
    if (body === "YES" || body === "Y") {
      // Update worker status to confirmed
      if (assignment) {
        await prisma.dispatchAssignment.update({
          where: { id: assignment.id },
          data: { status: "confirmed" },
        });
      }

      // Store communication
      await prisma.dispatchCommunication.create({
        data: {
          assignmentId: assignment?.id || "",
          userId: worker.id,
          phoneNumber: from,
          direction: "inbound",
          message: body,
          twilioSid: messageSid,
          twilioStatus: "received",
        },
      });

      // Send confirmation back
      await sendSMS(from, "Thank you for confirming! See you there. 👍");

      // Notify dispatcher
      if (DISPATCHER_PHONE) {
        await sendSMS(
          DISPATCHER_PHONE,
          `✅ ${worker.name} CONFIRMED for today's assignment`
        );
      }

    } else if (body === "NO" || body === "N") {
      // Update worker status to declined
      if (assignment) {
        await prisma.dispatchAssignment.update({
          where: { id: assignment.id },
          data: { status: "declined" },
        });
      }

      // Store communication
      await prisma.dispatchCommunication.create({
        data: {
          assignmentId: assignment?.id || "",
          userId: worker.id,
          phoneNumber: from,
          direction: "inbound",
          message: body,
          twilioSid: messageSid,
          twilioStatus: "received",
        },
      });

      // Send acknowledgment
      await sendSMS(from, "Thank you for letting us know. We'll find a replacement.");

      // Alert dispatcher immediately
      if (DISPATCHER_PHONE) {
        await sendSMS(
          DISPATCHER_PHONE,
          `⚠️ ${worker.name} DECLINED for today's assignment. Need replacement!`
        );
      }

    } else {
      // Handle other messages (questions, issues, etc.)

      // Store communication
      await prisma.dispatchCommunication.create({
        data: {
          assignmentId: assignment?.id || "",
          userId: worker.id,
          phoneNumber: from,
          direction: "inbound",
          message: body,
          twilioSid: messageSid,
          twilioStatus: "received",
        },
      });

      // Forward to dispatcher
      if (DISPATCHER_PHONE) {
        await sendSMS(
          DISPATCHER_PHONE,
          `Message from ${worker.name} (${worker.workerRole}):\n"${body}"\n\nReply to: ${from}`
        );

        // Auto-reply to worker
        await sendSMS(
          from,
          "Your message has been forwarded to dispatch. Someone will respond shortly."
        );
      } else {
        // If no dispatcher phone, just acknowledge
        await sendSMS(
          from,
          "Message received. Please reply YES to confirm or NO to decline your assignment."
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Twilio webhook signature verification (optional but recommended)
export async function GET() {
  return NextResponse.json({
    message: "Twilio webhook endpoint. Configure in Twilio console.",
    url: "https://yourdomain.com/api/dispatch/webhook"
  });
}