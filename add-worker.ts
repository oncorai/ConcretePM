import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addWorker() {
  // Replace with your actual phone number
  const phoneNumber = '+18327906332'; // Your phone number
  const workerName = 'Jacob'; // Your name
  const role = 'super'; // Role: 'super', 'pm', 'foreman', 'carpenter', 'laborer', etc.

  try {
    // Check if worker already exists
    const existing = await prisma.dispatchWorker.findUnique({
      where: { phone: phoneNumber }
    });

    if (existing) {
      console.log('Worker already exists:', existing);
      return;
    }

    // Create new worker
    const worker = await prisma.dispatchWorker.create({
      data: {
        name: workerName,
        phone: phoneNumber,
        workerRole: role,
        status: 'active',
        skills: []
      }
    });

    console.log('Worker created successfully:', worker);
  } catch (error) {
    console.error('Error adding worker:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWorker();
