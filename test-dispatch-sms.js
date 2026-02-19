// Test dispatch SMS for tonight
// Run with: node test-dispatch-sms.js

const testDispatchMessage = () => {
  const workerName = "Jacob";
  const projectName = "Highway 45 Expansion";
  const location = "I-45 & Beltway 8";
  const startTime = "7:00 AM";
  const crewName = "Crew A";
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const message = `Hi ${workerName}, you've been assigned to ${projectName} (${crewName}) for ${formattedDate} at ${startTime}.
📍 ${location}

Reply YES to confirm or NO to decline.`;

  console.log("Sample Dispatch Message:");
  console.log("========================");
  console.log(message);
  console.log("========================");
  console.log("\nMessage details:");
  console.log("- Length:", message.length, "characters");
  console.log("- SMS segments:", Math.ceil(message.length / 160));
  console.log("\nTo send this as a test:");
  console.log("1. Get a Twilio phone number");
  console.log("2. Add TWILIO_PHONE_NUMBER to .env.local");
  console.log("3. Use the test endpoint at /api/test-sms");
};

// Simulate what the worker would see
console.log("\n📱 INCOMING TEXT MESSAGE");
console.log("From: Company Dispatch");
console.log("------------------------\n");

testDispatchMessage();

console.log("\n📱 WORKER REPLIES: YES");
console.log("System Response: 'Thank you for confirming! See you there. 👍'");

console.log("\n📱 WORKER REPLIES: NO");
console.log("System Response: 'Thank you for letting us know. We'll find a replacement.'");

console.log("\n📱 WORKER ASKS: 'Can I bring my own truck?'");
console.log("System Response: 'Your message has been forwarded to dispatch. Someone will respond shortly.'");
console.log("Dispatcher gets: 'Message from Jacob (Carpenter): Can I bring my own truck?'");