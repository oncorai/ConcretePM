import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    // Check regular projects
    const projects = await prisma.project.findMany();
    console.log(`\n📁 Projects in database: ${projects.length}`);
    projects.forEach(p => {
      console.log(`  - ${p.name} (status: ${p.status}, id: ${p.id})`);
    });

    // Check dispatch groups
    const dispatchGroups = await prisma.dispatchGroup.findMany();
    console.log(`\n📋 Dispatch Groups: ${dispatchGroups.length}`);
    dispatchGroups.forEach(g => {
      console.log(`  - ${g.name} (projectId: ${g.projectId})`);
    });

    // Check dispatch workers
    const dispatchWorkers = await prisma.dispatchWorker.findMany();
    console.log(`\n👷 Dispatch Workers: ${dispatchWorkers.length}`);

    // Check regular workers
    const workers = await prisma.worker.findMany();
    console.log(`\n👥 Regular Workers: ${workers.length}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkProjects();