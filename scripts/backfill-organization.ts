import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting organization backfill...');

  // 1. Create default organization
  let defaultOrg = await prisma.organization.findFirst({
    where: { slug: 'default' }
  });

  if (!defaultOrg) {
    defaultOrg = await prisma.organization.create({
      data: {
        name: 'Default Organization',
        slug: 'default',
        plan: 'enterprise', // Set as enterprise to avoid limits during transition
        maxProjects: 999,
        maxWorkers: 999
      }
    });
    console.log('✅ Created default organization:', defaultOrg.id);
  } else {
    console.log('✅ Default organization already exists:', defaultOrg.id);
  }

  // 2. Update all users without an organization
  const usersUpdated = await prisma.user.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id }
  });
  console.log(`✅ Updated ${usersUpdated.count} users`);

  // 3. Update all projects without an organization
  const projectsUpdated = await prisma.project.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id }
  });
  console.log(`✅ Updated ${projectsUpdated.count} projects`);

  // 4. Update all dispatch workers without an organization
  const workersUpdated = await prisma.dispatchWorker.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id }
  });
  console.log(`✅ Updated ${workersUpdated.count} dispatch workers`);

  console.log('\n🎉 Backfill complete!');
}

main()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
