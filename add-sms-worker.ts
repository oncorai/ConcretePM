import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addWorker() {
  // Your phone number (without +1 prefix as per SMS webhook code)
  const phoneNumber = '8325355189'; // Your phone: +1 (832) 535-5189
  const workerName = 'Jacob Skinner';
  const role = 'superintendent'; // For access to CODES command

  try {
    // Check if worker already exists
    const existing = await prisma.worker.findUnique({
      where: { phoneNumber }
    });

    if (existing) {
      console.log('✅ Worker already exists:', existing);
      return;
    }

    // Create new worker
    const worker = await prisma.worker.create({
      data: {
        name: workerName,
        phoneNumber: phoneNumber,
        role: role,
        status: 'active',
        skills: []
      }
    });

    console.log('✅ Worker created successfully:', worker);
    console.log('\n📱 You can now text these commands to +16232949652:');
    console.log('   HELP - List commands');
    console.log('   IN - Clock in');
    console.log('   OUT - Clock out');
    console.log('   HOURS - Check hours');
    console.log('   STATUS - Today\'s assignment');
    console.log('   CODES - View cost codes (superintendent only)');
  } catch (error) {
    console.error('❌ Error adding worker:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWorker();
