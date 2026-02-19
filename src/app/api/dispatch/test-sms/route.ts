import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendSMS, formatPhoneForTwilio, twilioClient, TWILIO_PHONE } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, message } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const testMessage = message || "Test SMS from Leaderboards Dispatch System. Reply STOP to opt out.";
    const formattedPhone = formatPhoneForTwilio(phone);

    console.log("Testing SMS configuration:");
    console.log("- Twilio configured:", twilioClient !== null);
    console.log("- From number:", TWILIO_PHONE);
    console.log("- To number:", formattedPhone);

    if (twilioClient) {
      try {
        const result = await sendSMS(formattedPhone, testMessage);
        return NextResponse.json({
          success: true,
          messageSid: result?.sid,
          status: result?.status,
          to: result?.to,
          from: result?.from,
        });
      } catch (error: any) {
        console.error("Twilio error:", error);
        return NextResponse.json({
          success: false,
          error: error.message || "Failed to send SMS",
          code: error.code,
          moreInfo: error.moreInfo,
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