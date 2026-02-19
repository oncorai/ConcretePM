import { NextResponse } from "next/server";
import { twilioClient } from "@/lib/twilio";

export async function GET() {
  if (!twilioClient) {
    return NextResponse.json({ error: "Twilio not configured" });
  }

  try {
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list({ limit: 10 });

    return NextResponse.json({
      success: true,
      phoneNumbers: phoneNumbers.map(num => ({
        phoneNumber: num.phoneNumber,
        friendlyName: num.friendlyName,
        capabilities: {
          sms: num.capabilities.sms,
          voice: num.capabilities.voice,
        }
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      code: error.code
    });
  }
}