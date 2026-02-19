import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPhoneForTwilio, sendSMS } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook data
    const formData = await request.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;

    if (!from || !body) {
      return NextResponse.json(
        { error: "Invalid webhook data" },
        { status: 400 }
      );
    }

    // Clean the phone number
    const cleanPhone = from.replace(/[^\d+]/g, "");

    // Find user by phone number
    const user = await prisma.user.findFirst({
      where: { phone: cleanPhone },
    });

    if (!user) {
      console.log(`Received SMS from unknown number: ${from}`);
      return NextResponse.json({ success: true });
    }

    // Find the most recent dispatch assignment for this user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignment = await prisma.dispatchAssignment.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: "pending",
      },
      include: {
        group: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!assignment) {
      // No pending assignment found
      await sendSMS(
        from,
        "No pending dispatch assignment found. Please contact your supervisor."
      );
      return NextResponse.json({ success: true });
    }

    // Parse the response
    const normalizedBody = body.trim().toUpperCase();
    let newStatus: string | null = null;
    let responseMessage: string | null = null;

    if (normalizedBody === "YES" || normalizedBody === "Y") {
      newStatus = "confirmed";
      responseMessage = `✅ Confirmed! See you at ${assignment.group.name} tomorrow at ${assignment.group.startTime}.`;
    } else if (normalizedBody === "NO" || normalizedBody === "N") {
      newStatus = "declined";
      responseMessage = `❌ Assignment declined. Your supervisor will be notified.`;
    } else {
      // Unrecognized response
      responseMessage = `Please reply YES to confirm or NO to decline your assignment to ${assignment.group.name}.`;
    }

    // Update assignment status if recognized
    if (newStatus) {
      await prisma.dispatchAssignment.update({
        where: { id: assignment.id },
        data: { status: newStatus },
      });
    }

    // Store the communication
    await prisma.dispatchCommunication.create({
      data: {
        assignmentId: assignment.id,
        userId: user.id,
        phoneNumber: cleanPhone,
        direction: "inbound",
        message: body,
        twilioSid: messageSid,
        twilioStatus: "received",
        sentAt: new Date(),
      },
    });

    // Send response if we have one
    if (responseMessage) {
      await sendSMS(from, responseMessage);

      // Store the outbound response
      await prisma.dispatchCommunication.create({
        data: {
          assignmentId: assignment.id,
          userId: user.id,
          phoneNumber: cleanPhone,
          direction: "outbound",
          message: responseMessage,
          response: body,
          sentAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}