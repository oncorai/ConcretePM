import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Twilio is configured
    const configured = Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );

    return NextResponse.json({
      configured,
      phoneNumber: configured ? process.env.TWILIO_PHONE_NUMBER : null,
    });
  } catch (error) {
    console.error("Failed to check SMS status:", error);
    return NextResponse.json(
      { error: "Failed to check SMS status" },
      { status: 500 }
    );
  }
}