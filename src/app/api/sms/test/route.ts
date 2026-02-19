import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendSMS, formatPhoneForTwilio, twilioClient } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Format phone for Twilio
    const formattedPhone = formatPhoneForTwilio(phone);

    // Test message
    const message = `🔧 Test SMS from Leaderboards Dispatch System\n\nThis is a test message to verify SMS delivery. If you received this, your SMS settings are working correctly!\n\nReply STOP to unsubscribe.`;

    if (twilioClient) {
      const result = await sendSMS(formattedPhone, message);
      if (result) {
        return NextResponse.json({
          success: true,
          messageSid: result.sid,
          status: result.status,
        });
      }
    } else {
      // Development mode without Twilio
      console.log(`[SMS Test] To ${formattedPhone}:`);
      console.log(message);
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Test SMS logged to console (Twilio not configured)",
      });
    }

    return NextResponse.json(
      { error: "Failed to send test SMS" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Failed to send test SMS:", error);
    return NextResponse.json(
      {
        error: "Failed to send test SMS",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}