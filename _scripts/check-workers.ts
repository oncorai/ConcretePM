import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWorkers() {
  try {
    const count = await prisma.worker.count();
    console.log(`Total workers in database: ${count}`);

    if (count > 0) {
      const workers = await prisma.worker.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      });

      console.log('\nFirst 5 workers:');
      workers.forEach(w => {
        console.log(`  - ${w.name} (created: ${w.createdAt})`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkWorkers();