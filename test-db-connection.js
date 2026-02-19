const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    console.log('✅ Database is ACTIVE and connected!');
    console.log('Database info:', result);
    
    // Check if organizationId column exists
    const tables = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Project' 
      AND column_name = 'organizationId'
    `;
    
    if (tables.length > 0) {
      console.log('✅ organizationId column EXISTS in Project table');
    } else {
      console.log('❌ organizationId column DOES NOT EXIST in Project table');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.message.includes('Tenant or user not found')) {
      console.error('   → Database is PAUSED');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
