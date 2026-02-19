import { NextRequest, NextResponse } from "next/server";
import { sendSMS, formatPhoneForTwilio, twilioClient, TWILIO_PHONE } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const testMessage = "Hello! This is a test from Leaderboards Dispatch System. The SMS integration is working correctly! 🎉";
    const formattedPhone = formatPhoneForTwilio(phone);

    console.log("Testing SMS:");
    console.log("- Twilio configured:", twilioClient !== null);
    console.log("- From number:", TWILIO_PHONE);
    console.log("- To number:", formattedPhone);

    if (twilioClient) {
      try {
        const result = await sendSMS(formattedPhone, testMessage);
        return NextResponse.json({
          success: true,
          message: "SMS sent successfully!",
          details: {
            messageSid: result?.sid,
            status: result?.status,
            to: result?.to,
            from: result?.from,
          }
        });
      } catch (error: any) {
        console.error("Twilio error:", error);
        return NextResponse.json({
          success: false,
          error: error.message || "Failed to send SMS",
          code: error.code,
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: "Twilio not configured",
        mockMessage: `[MOCK] Would send to ${formattedPhone}: ${testMessage}`,
      });
    }
  } catch (error) {
    console.error("Test SMS error:", error);
    return NextResponse.json(
      { error: "Failed to test SMS" },
      { status: 500 }
    );
  }
}