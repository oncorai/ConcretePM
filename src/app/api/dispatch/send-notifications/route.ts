import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date = new Date() } = await req.json();

    // Get tomorrow's date for dispatch
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Get all assignments for tomorrow
    const assignments = await prisma.workerAssignment.findMany({
      where: {
        date: {
          gte: tomorrow,
          lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        worker: true,
        dispatchGroup: true
      }
    });

    const results = [];
    const errors = [];

    for (const assignment of assignments) {
      try {
        const message =
          `📋 TOMORROW'S ASSIGNMENT\n\n` +
          `Worker: ${assignment.worker.name}\n` +
          `Project: ${assignment.dispatchGroup.name}\n` +
          `Location: ${assignment.dispatchGroup.location || 'TBD'}\n` +
          `Report Time: ${assignment.dispatchGroup.time}\n\n` +
          `Reply YES to confirm or NO if you cannot make it.`;

        const twilioMessage = await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: `+1${assignment.worker.phoneNumber}`
        });

        // Update assignment status to notified
        await prisma.workerAssignment.update({
          where: { id: assignment.id },
          data: { status: "pending" }
        });

        // Log the message
        await prisma.message.create({
          data: {
            content: message,
            recipientPhone: assignment.worker.phoneNumber,
            recipientName: assignment.worker.name,
            status: "SENT",
            twilioSid: twilioMessage.sid,
            workerId: assignment.worker.id,
            sentAt: new Date()
          }
        });

        results.push({
          worker: assignment.worker.name,
          phone: assignment.worker.phoneNumber,
          project: assignment.dispatchGroup.name,
          status: "sent"
        });

      } catch (error: any) {
        console.error(`Failed to send to ${assignment.worker.name}:`, error);
        errors.push({
          worker: assignment.worker.name,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      date: tomorrow.toISOString().split('T')[0],
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error: any) {
    console.error("Send dispatch notifications error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}