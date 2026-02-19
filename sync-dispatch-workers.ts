import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Syncs DispatchWorker records to Worker table for SMS functionality
 * Run this after adding workers in the dispatch tab
 */
async function syncDispatchWorkers() {
  try {
    // Get all active dispatch workers
    const dispatchWorkers = await prisma.dispatchWorker.findMany({
      where: {
        isDeleted: false,
        status: 'active'
      }
    });

    console.log(`Found ${dispatchWorkers.length} active dispatch workers`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const dw of dispatchWorkers) {
      // Clean phone number (remove +1 prefix for Worker table)
      const phoneNumber = dw.phone.replace('+1', '').replace(/\D/g, '');

      // Check if worker exists in Worker table
      const existingWorker = await prisma.worker.findUnique({
        where: { phoneNumber }
      });

      if (existingWorker) {
        // Update existing worker
        await prisma.worker.update({
          where: { id: existingWorker.id },
          data: {
            name: dw.name,
            role: dw.workerRole,
            skills: dw.skills,
            status: dw.status
          }
        });
        updated++;
        console.log(`✅ Updated: ${dw.name} (${phoneNumber})`);
      } else {
        // Create new worker for SMS
        await prisma.worker.create({
          data: {
            name: dw.name,
            phoneNumber: phoneNumber,
            role: dw.workerRole,
            skills: dw.skills,
            status: dw.status
          }
        });
        created++;
        console.log(`✨ Created: ${dw.name} (${phoneNumber})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`\n✅ All dispatch workers can now use SMS!`);

  } catch (error) {
    console.error('❌ Error syncing workers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncDispatchWorkers();
