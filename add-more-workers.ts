import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMoreWorkers() {
  try {
    console.log('Adding more dispatch workers...');

    // Additional workers to add
    const additionalWorkers = [
      // More Carpenters
      { name: 'James Wilson', phone: '6235551111', workerRole: 'Carpenter' },
      { name: 'Robert Johnson', phone: '6235552222', workerRole: 'Carpenter' },
      { name: 'Michael Brown', phone: '6235553333', workerRole: 'Carpenter' },
      { name: 'David Jones', phone: '6235554444', workerRole: 'Carpenter' },
      { name: 'Richard Davis', phone: '6235555555', workerRole: 'Carpenter' },

      // More Laborers
      { name: 'Jose Martinez', phone: '6235556666', workerRole: 'Laborer' },
      { name: 'Luis Rodriguez', phone: '6235557777', workerRole: 'Laborer' },
      { name: 'Antonio Garcia', phone: '6235558888', workerRole: 'Laborer' },
      { name: 'Fernando Lopez', phone: '6235559999', workerRole: 'Laborer' },
      { name: 'Ramon Gonzalez', phone: '6235550000', workerRole: 'Laborer' },
      { name: 'Jorge Sanchez', phone: '6235551212', workerRole: 'Laborer' },
      { name: 'Alberto Perez', phone: '6235552323', workerRole: 'Laborer' },

      // More Operators
      { name: 'William Anderson', phone: '6235553434', workerRole: 'Operator' },
      { name: 'Paul Thompson', phone: '6235554545', workerRole: 'Operator' },
      { name: 'Mark White', phone: '6235555656', workerRole: 'Operator' },

      // More Concrete Workers
      { name: 'George Harris', phone: '6235556767', workerRole: 'Concrete' },
      { name: 'Kevin Martin', phone: '6235557878', workerRole: 'Concrete' },
      { name: 'Brian Jackson', phone: '6235558989', workerRole: 'Concrete' },
      { name: 'Edward Thomas', phone: '6235559090', workerRole: 'Concrete' },

      // Electricians
      { name: 'Christopher Moore', phone: '6235550101', workerRole: 'Electrician' },
      { name: 'Daniel Taylor', phone: '6235551313', workerRole: 'Electrician' },
      { name: 'Matthew Walker', phone: '6235552424', workerRole: 'Electrician' },

      // Plumbers
      { name: 'Andrew Robinson', phone: '6235553535', workerRole: 'Plumber' },
      { name: 'Joshua Clark', phone: '6235554646', workerRole: 'Plumber' },

      // Iron Workers
      { name: 'Ryan Lewis', phone: '6235555757', workerRole: 'Iron Worker' },
      { name: 'Eric Lee', phone: '6235556868', workerRole: 'Iron Worker' },
      { name: 'Brandon Hill', phone: '6235557979', workerRole: 'Iron Worker' },

      // Masons
      { name: 'Jason Green', phone: '6235558080', workerRole: 'Mason' },
      { name: 'Jeffrey Adams', phone: '6235559191', workerRole: 'Mason' },

      // Painters
      { name: 'Gary Baker', phone: '6235550202', workerRole: 'Painter' },
      { name: 'Stephen Nelson', phone: '6235551414', workerRole: 'Painter' },

      // Roofers
      { name: 'Larry Carter', phone: '6235552525', workerRole: 'Roofer' },
      { name: 'Justin Mitchell', phone: '6235553636', workerRole: 'Roofer' },

      // Safety Officers
      { name: 'Scott Roberts', phone: '6235554747', workerRole: 'Safety Officer' },
      { name: 'Frank Turner', phone: '6235555858', workerRole: 'Safety Officer' },
    ];

    let addedCount = 0;
    let updatedCount = 0;

    for (const worker of additionalWorkers) {
      const existing = await prisma.dispatchWorker.findFirst({
        where: { phone: worker.phone }
      });

      if (!existing) {
        await prisma.dispatchWorker.create({
          data: {
            name: worker.name,
            phone: worker.phone,
            workerRole: worker.workerRole,
            isDeleted: false
          }
        });
        addedCount++;
      } else {
        await prisma.dispatchWorker.update({
          where: { id: existing.id },
          data: {
            name: worker.name,
            workerRole: worker.workerRole,
            isDeleted: false
          }
        });
        updatedCount++;
      }

      // Also create matching Worker record for SMS functionality
      const existingWorker = await prisma.worker.findUnique({
        where: { phoneNumber: worker.phone }
      });

      if (!existingWorker) {
        await prisma.worker.create({
          data: {
            name: worker.name,
            phoneNumber: worker.phone,
            role: worker.workerRole.toLowerCase(),
            skills: [],
            status: 'active'
          }
        });
      }
    }

    console.log(`✅ Added ${addedCount} new workers`);
    console.log(`✅ Updated ${updatedCount} existing workers`);

    // Get total worker count
    const totalWorkers = await prisma.dispatchWorker.count({
      where: { isDeleted: false }
    });

    console.log(`\n📊 Total active dispatch workers: ${totalWorkers}`);
    console.log('\nWorker roles breakdown:');

    const roles = await prisma.dispatchWorker.groupBy({
      by: ['workerRole'],
      _count: true,
      where: { isDeleted: false }
    });

    roles.forEach(role => {
      console.log(`  ${role.workerRole}: ${role._count} workers`);
    });

    console.log('\n🎯 You now have plenty of workers to assign to different projects!');
    console.log('Go to the Dispatch page and drag workers to assign them to crews.');

  } catch (error) {
    console.error('Error adding workers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreWorkers();