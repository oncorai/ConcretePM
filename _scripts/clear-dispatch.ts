import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDispatch() {
  try {
    console.log('Clearing all dispatch data...');

    // Delete all dispatch snapshots
    const snapshots = await prisma.dispatchSnapshot.deleteMany({});
    console.log(`✅ Deleted ${snapshots.count} dispatch snapshots`);

    // Delete all dispatch assignments
    const assignments = await prisma.dispatchAssignment.deleteMany({});
    console.log(`✅ Deleted ${assignments.count} dispatch assignments`);

    // Delete all dispatch workers
    const dispatchWorkers = await prisma.dispatchWorker.deleteMany({});
    console.log(`✅ Deleted ${dispatchWorkers.count} dispatch workers`);

    // Double check regular workers table
    const workerCount = await prisma.worker.count();
    console.log(`\nCurrent workers in main table: ${workerCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

clearDispatch();