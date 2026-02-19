import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDispatchData() {
  try {
    console.log('Setting up dispatch test data...');

    // Create dispatch groups (projects/sites)
    // First check if groups exist
    let group1 = await prisma.dispatchGroup.findFirst({
      where: { name: 'Downtown Office Tower' }
    });

    if (!group1) {
      group1 = await prisma.dispatchGroup.create({
        data: {
          name: 'Downtown Office Tower',
          location: '123 Main St, Downtown',
          startTime: '7:00 AM',
          time: '7:00 AM',
          status: 'active',
          isDeleted: false
        }
      });
    }

    let group2 = await prisma.dispatchGroup.findFirst({
      where: { name: 'Westside Residential' }
    });

    if (!group2) {
      group2 = await prisma.dispatchGroup.create({
        data: {
          name: 'Westside Residential',
          location: '456 Oak Ave, Westside',
          startTime: '6:30 AM',
          time: '6:30 AM',
          status: 'active',
          isDeleted: false
        }
      });
    }

    let group3 = await prisma.dispatchGroup.findFirst({
      where: { name: 'Airport Expansion' }
    });

    if (!group3) {
      group3 = await prisma.dispatchGroup.create({
        data: {
          name: 'Airport Expansion',
          location: 'Phoenix Sky Harbor',
          startTime: '6:00 AM',
          time: '6:00 AM',
          status: 'active',
          isDeleted: false
        }
      });
    }

    console.log('✅ Created dispatch groups');

    // Create dispatch workers
    const workers = [
      // Foreman/Supervisors
      { name: 'Jacob Skinner', phone: '6232949652', workerRole: 'Foreman' },
      { name: 'Mike Johnson', phone: '6235551234', workerRole: 'Foreman' },

      // Carpenters
      { name: 'John Smith', phone: '6235552345', workerRole: 'Carpenter' },
      { name: 'Bob Wilson', phone: '6235553456', workerRole: 'Carpenter' },
      { name: 'Tom Davis', phone: '6235554567', workerRole: 'Carpenter' },

      // Laborers
      { name: 'Carlos Martinez', phone: '6235555678', workerRole: 'Laborer' },
      { name: 'Juan Rodriguez', phone: '6235556789', workerRole: 'Laborer' },
      { name: 'Miguel Garcia', phone: '6235557890', workerRole: 'Laborer' },
      { name: 'Pedro Lopez', phone: '6235558901', workerRole: 'Laborer' },

      // Operators
      { name: 'Dave Brown', phone: '6235559012', workerRole: 'Operator' },
      { name: 'Steve Miller', phone: '6235550123', workerRole: 'Operator' },

      // Concrete Workers
      { name: 'Frank Thomas', phone: '6235551235', workerRole: 'Concrete' },
      { name: 'Jim Anderson', phone: '6235552346', workerRole: 'Concrete' },
      { name: 'Rick Taylor', phone: '6235553457', workerRole: 'Concrete' },
    ];

    for (const worker of workers) {
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
      } else {
        await prisma.dispatchWorker.update({
          where: { id: existing.id },
          data: {
            name: worker.name,
            workerRole: worker.workerRole,
            isDeleted: false
          }
        });
      }
    }

    console.log('✅ Created dispatch workers');

    // Create crews for each group
    const crew1Id = `${group1.id}-crew-1`;
    const existingCrew1 = await prisma.dispatchCrew.findUnique({
      where: { id: crew1Id }
    });

    if (!existingCrew1) {
      await prisma.dispatchCrew.create({
        data: {
          id: crew1Id,
          groupId: group1.id,
          name: 'Crew A',
          startTime: '7:00 AM'
        }
      });
    }

    const crew2Id = `${group1.id}-crew-2`;
    const existingCrew2 = await prisma.dispatchCrew.findUnique({
      where: { id: crew2Id }
    });

    if (!existingCrew2) {
      await prisma.dispatchCrew.create({
        data: {
          id: crew2Id,
          groupId: group1.id,
          name: 'Crew B',
          startTime: '7:30 AM'
        }
      });
    }

    console.log('✅ Created dispatch crews');

    // Also ensure we have matching Worker records for SMS functionality
    for (const worker of workers) {
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
      } else {
        await prisma.worker.update({
          where: { phoneNumber: worker.phone },
          data: {
            name: worker.name,
            role: worker.workerRole.toLowerCase()
          }
        });
      }
    }

    console.log('✅ Linked workers to SMS system');

    // Create some sample assignments for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get Jacob's worker record
    const jacob = await prisma.dispatchWorker.findFirst({
      where: { phone: '6232949652' }
    });

    if (jacob) {
      // Ensure Jacob has a user record
      let user = await prisma.user.findFirst({
        where: { phone: '6232949652' }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: 'Jacob Skinner',
            email: `jacob.${Date.now()}@leaderboards.local`,
            password: 'temp123', // Temporary password
            phone: '6232949652',
            role: 'worker'
          }
        });
      }

      // Link the dispatch worker to the user
      await prisma.dispatchWorker.update({
        where: { id: jacob.id },
        data: { userId: user.id }
      });

      // Create an assignment for Jacob
      const existingAssignment = await prisma.dispatchAssignment.findUnique({
        where: {
          userId_groupId_date: {
            userId: user.id,
            groupId: group1.id,
            date: today
          }
        }
      });

      if (!existingAssignment) {
        await prisma.dispatchAssignment.create({
          data: {
            userId: user.id,
            groupId: group1.id,
            date: today,
            status: 'pending',
            position: 0
          }
        });
      }

      console.log('✅ Created sample assignment for Jacob');
    }

    console.log('\n📊 Dispatch System Ready!');
    console.log('- 3 Project Sites');
    console.log('- 14 Workers');
    console.log('- 2 Crews');
    console.log('\nYou can now:');
    console.log('1. Go to the Dispatch page in your app');
    console.log('2. Drag workers between projects');
    console.log('3. Text "STATUS" to see your assignment');
    console.log('4. Send dispatch notifications via SMS');

  } catch (error) {
    console.error('Error setting up dispatch data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDispatchData();