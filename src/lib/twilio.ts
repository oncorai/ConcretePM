import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn("Twilio credentials not configured. SMS features will be disabled.");
}

// Create Twilio client only if credentials are available
export const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const TWILIO_PHONE = twilioPhoneNumber || "";

export async function sendSMS(to: string, message: string) {
  if (!twilioClient) {
    console.warn("Twilio not configured. Skipping SMS send.");
    return null;
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to,
    });

    return result;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}

export async function sendDispatchNotification(
  workerPhone: string,
  workerName: string,
  projectName: string,
  location: string | null,
  startTime: string,
  date: Date,
  crewName?: string | null
) {
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // English message
  let message = `Hi ${workerName}, you've been assigned to ${projectName}`;

  if (crewName) {
    message += ` (${crewName})`;
  }

  message += ` for ${formattedDate} at ${startTime}.`;

  if (location) {
    message += `\n📍 ${location}`;
  }

  message += `\n\nReply YES to confirm or NO to decline.`;

  // Spanish translation
  message += `\n\n━━━━━━━━━━\n\n`;
  message += `Hola ${workerName}, has sido asignado a ${projectName}`;

  if (crewName) {
    message += ` (${crewName})`;
  }

  message += ` para ${formattedDate} a las ${startTime}.`;

  if (location) {
    message += `\n📍 ${location}`;
  }

  message += `\n\nResponde SI para confirmar o NO para rechazar.`;

  return sendSMS(workerPhone, message);
}

export function formatPhoneForTwilio(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");

  // If it's a 10-digit US number, add country code
  if (cleaned.length === 10) {
    cleaned = "1" + cleaned;
  }

  // Add + prefix if not present
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}