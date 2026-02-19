import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllWorkers() {
  try {
    console.log('Deleting all related data...');

    // Delete all time entries first (foreign key constraint)
    const timeEntriesResult = await prisma.timeEntry.deleteMany({});
    console.log(`  Deleted ${timeEntriesResult.count} time entries`);

    // Now delete all workers
    console.log('Deleting all workers from database...');
    const workersResult = await prisma.worker.deleteMany({});
    console.log(`✅ Successfully deleted ${workersResult.count} workers`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error deleting workers:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

deleteAllWorkers();