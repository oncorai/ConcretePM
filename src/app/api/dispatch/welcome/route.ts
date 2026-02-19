import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSMS, formatPhoneForTwilio, twilioClient } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workerId } = await request.json();

    // Get worker details
    const worker = await prisma.dispatchWorker.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const message = `Welcome to our team, ${worker.name}! 🎉

You've been added to our dispatch system. You'll receive text notifications when assigned to projects.

Important:
- Reply YES to confirm assignments
- Reply NO to decline
- Contact dispatch for any questions

Save this number for future communications.

Thank you for joining us!`;

    const formattedPhone = formatPhoneForTwilio(worker.phone);

    if (twilioClient) {
      try {
        const result = await sendSMS(formattedPhone, message);
        return NextResponse.json({
          success: true,
          messageSid: result?.sid,
        });
      } catch (error: any) {
        console.error("Failed to send welcome SMS:", error);
        return NextResponse.json({
          error: error.message || "Failed to send SMS",
        }, { status: 500 });
      }
    } else {
      console.log(`[SMS Mock] Welcome message to ${formattedPhone}`);
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Welcome SMS would be sent (Twilio not configured)",
      });
    }
  } catch (error) {
    console.error("Failed to send welcome message:", error);
    return NextResponse.json(
      { error: "Failed to send welcome message" },
      { status: 500 }
    );
  }
}