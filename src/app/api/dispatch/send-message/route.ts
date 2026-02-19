import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workerId, phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    // Get worker info if workerId provided
    let worker = null;
    if (workerId) {
      worker = await prisma.worker.findUnique({
        where: { id: workerId }
      });
    }

    // Send SMS via Twilio
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+1${phoneNumber}`
    });

    // Save message to database
    await prisma.message.create({
      data: {
        workerId: workerId || null,
        content: message,
        recipientPhone: phoneNumber,
        recipientName: worker?.name || "Unknown",
        status: "SENT",
        twilioSid: twilioMessage.sid
        // Don't set sentAt - that's for inbound messages
      }
    });

    return NextResponse.json({
      success: true,
      messageId: twilioMessage.sid
    });

  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}