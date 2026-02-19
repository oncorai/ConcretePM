import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProjectStatus() {
  try {
    // Update all projects to have "active" status
    const result = await prisma.project.updateMany({
      where: {
        OR: [
          { status: null },
          { status: undefined },
          { status: "" }
        ]
      },
      data: {
        status: "active"
      }
    });

    console.log(`✅ Updated ${result.count} projects to active status`);

    // Verify the update
    const projects = await prisma.project.findMany();
    console.log('\n📁 Projects after update:');
    projects.forEach(p => {
      console.log(`  - ${p.name} (status: ${p.status})`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

fixProjectStatus();