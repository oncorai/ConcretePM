import { notifyManagersOfDecline, checkAndNotifyFullCrewConfirmed } from "../src/lib/dispatch-notifications";
import { prisma } from "../src/lib/prisma";

async function testNotifications() {
  console.log("Testing SMS notification system...\n");

  try {
    // Get a test worker with an assignment
    const worker = await prisma.worker.findFirst({
      include: {
        assignments: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          include: {
            dispatchGroup: true
          },
          take: 1
        }
      }
    });

    if (!worker || !worker.assignments[0]) {
      console.log("No worker with assignment found for testing");
      return;
    }

    console.log(`Found worker: ${worker.name}`);
    console.log(`Assignment: ${worker.assignments[0].dispatchGroup.name}\n`);

    // Test decline notification
    console.log("1. Testing decline notification...");
    await notifyManagersOfDecline(
      worker.id,
      worker.assignments[0].id,
      worker.assignments[0].date
    );
    console.log("   Decline notification test complete\n");

    // Test full crew confirmation
    console.log("2. Testing full crew confirmation...");
    await checkAndNotifyFullCrewConfirmed(
      worker.assignments[0].dispatchGroupId,
      worker.assignments[0].date
    );
    console.log("   Full crew confirmation test complete\n");

    console.log("All notification tests completed!");

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications();