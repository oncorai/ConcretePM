import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to get or create a User for a DispatchWorker
// Updated to handle existing users with same phone number
async function getOrCreateUserForWorker(workerId: string) {
  const worker = await prisma.dispatchWorker.findUnique({
    where: { id: workerId }
  });

  if (!worker) {
    throw new Error(`Worker not found: ${workerId}`);
  }

  // If worker already has a userId, return it
  if (worker.userId) {
    return worker.userId;
  }

  // Check if a User with this phone already exists
  let user = await prisma.user.findFirst({
    where: { phone: worker.phone }
  });

  // Create a new User for this worker if one doesn't exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: worker.name,
        email: `${worker.phone}@dispatch.local`, // Use phone number as email base
        password: 'dispatch123', // Default password for dispatch workers
        phone: worker.phone,
        role: 'worker'
      }
    });
  }

  // Link the User to the DispatchWorker
  await prisma.dispatchWorker.update({
    where: { id: workerId },
    data: { userId: user.id }
  });

  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);


    // OPTIMIZATION: Fetch everything in parallel instead of sequentially
    const [assignments, projects, workers] = await Promise.all([
      // Get assignments with user data included
      prisma.dispatchAssignment.findMany({
        where: {
          date: {
            gte: date,
            lt: endDate,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              dispatchWorkerProfile: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  workerRole: true,
                }
              }
            }
          }
        },
      }),

      // Get projects for this organization
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          location: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: "asc" },
      }),

      // Get workers for this organization
      prisma.dispatchWorker.findMany({
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          workerRole: true,
          userId: true,
        },
        orderBy: { name: "asc" },
      })
    ]);

    // Convert projects to dispatch groups format
    const groups = projects.map(project => ({
      id: project.id,
      name: project.name,
      location: project.location || "",
      startTime: "7:00 AM",
      time: "7:00 AM",
      foremanId: null,
      status: "active",
      isDeleted: false,
      projectId: project.id,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));

    // OPTIMIZATION: Build assignment map (userId -> assignment) in one pass
    const assignmentByUserId = new Map(
      assignments.map(a => [a.userId, a])
    );

    // OPTIMIZATION: Build worker map (userId -> worker) in one pass
    const workerByUserId = new Map(
      workers.filter(w => w.userId).map(w => [w.userId!, w])
    );

    // OPTIMIZATION: Track assigned worker IDs
    const assignedWorkerIds = new Set(
      assignments
        .map(a => workerByUserId.get(a.userId)?.id)
        .filter(Boolean)
    );

    // OPTIMIZATION: Transform groups with their assigned workers (simplified)
    const transformedGroups = groups.map((group) => {
      // Get assignments for this group and map to workers
      const groupWorkers = assignments
        .filter(a => a.groupId === group.id && !a.crewId)
        .map(assignment => {
          const worker = workerByUserId.get(assignment.userId);
          if (!worker) return null;
          return {
            id: worker.id,
            name: worker.name,
            phone: worker.phone,
            workerRole: worker.workerRole,
            status: assignment.status || "pending",
            groupId: group.id
          };
        })
        .filter(Boolean);

      // OPTIMIZATION: Extract special roles in one pass
      let projectManager: any = null;
      let superintendent: any = null;
      let foreman: any = null;
      const regularWorkers: any[] = [];

      groupWorkers.forEach(worker => {
        if (!worker) return; // TypeScript null check
        const role = worker.workerRole?.toLowerCase();
        if (role === 'project manager' && !projectManager) {
          projectManager = worker;
        } else if (role === 'superintendent' && !superintendent) {
          superintendent = worker;
        } else if (role === 'foreman' && !foreman) {
          foreman = worker;
        } else {
          regularWorkers.push(worker);
        }
      });

      return {
        id: group.id,
        name: group.name,
        location: group.location,
        startTime: group.startTime,
        projectManager,
        superintendent,
        foreman,
        workers: regularWorkers,
        crewTimes: [], // Simplified: no crew times for now
      };
    });

    // Get unassigned workers
    const unassignedWorkers = workers
      .filter(worker => !assignedWorkerIds.has(worker.id))
      .map((worker) => ({
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        workerRole: worker.workerRole,
        status: "pending" as const,
        groupId: null,
      }));

    return NextResponse.json({
      groups: transformedGroups,
      unassignedWorkers,
    });
  } catch (error) {
    console.error("Failed to fetch dispatch data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispatch data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date: dateStr, groups, unassignedWorkers } = body;


    // Parse the date
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    // Start a transaction to update all assignments
    await prisma.$transaction(async (tx) => {
      // Delete existing assignments for this date
      await tx.dispatchAssignment.deleteMany({
        where: {
          date: {
            gte: date,
            lt: endDate,
          },
        },
      });

      // OPTIMIZATION: Collect all worker IDs upfront to batch process them
      const allWorkerIds = new Set<string>();
      for (const group of groups || []) {
        if (group.projectManager) allWorkerIds.add(group.projectManager.id);
        if (group.superintendent) allWorkerIds.add(group.superintendent.id);
        if (group.foreman) allWorkerIds.add(group.foreman.id);
        for (const worker of group.workers || []) {
          allWorkerIds.add(worker.id);
        }
        for (const crewTime of group.crewTimes || []) {
          for (const worker of crewTime.workers || []) {
            allWorkerIds.add(worker.id);
          }
        }
      }

      // OPTIMIZATION: Fetch all workers in ONE query
      const workersData = await tx.dispatchWorker.findMany({
        where: { id: { in: Array.from(allWorkerIds) } }
      });

      // OPTIMIZATION: Create map for O(1) lookup
      const workerMap = new Map(workersData.map(w => [w.id, w]));

      // OPTIMIZATION: Find workers that need users created
      const workersNeedingUsers = workersData.filter(w => !w.userId);

      // OPTIMIZATION: Check for existing users by phone (batch query)
      const existingUsers = await tx.user.findMany({
        where: {
          phone: { in: workersNeedingUsers.map(w => w.phone) }
        }
      });
      const phoneToUserMap = new Map(existingUsers.map(u => [u.phone, u]));

      // OPTIMIZATION: Batch create new users for workers that don't have them
      const workersNeedingNewUsers = workersNeedingUsers.filter(
        w => !phoneToUserMap.has(w.phone)
      );

      if (workersNeedingNewUsers.length > 0) {
        // Note: createMany doesn't return IDs, so we need to create individually
        // but we batch them in a loop without additional lookups
        const newUsers = await Promise.all(
          workersNeedingNewUsers.map(worker =>
            tx.user.create({
              data: {
                name: worker.name,
                email: `${worker.phone}@dispatch.local`,
                password: 'dispatch123',
                phone: worker.phone,
                role: 'worker',
              }
            })
          )
        );

        // Add new users to the phone map
        newUsers.forEach(user => phoneToUserMap.set(user.phone!, user));
      }

      // OPTIMIZATION: Batch link workers to users
      const workerUserLinks = workersNeedingUsers.map(worker => {
        const user = phoneToUserMap.get(worker.phone);
        return { workerId: worker.id, userId: user!.id };
      });

      // Update workers with their userIds
      await Promise.all(
        workerUserLinks.map(({ workerId, userId }) =>
          tx.dispatchWorker.update({
            where: { id: workerId },
            data: { userId }
          })
        )
      );

      // Update the worker map with the new userIds
      workerUserLinks.forEach(({ workerId, userId }) => {
        const worker = workerMap.get(workerId);
        if (worker) {
          worker.userId = userId;
        }
      });

      // Helper to get userId from workerId (now O(1) lookup, no DB calls)
      const getUserIdForWorker = (workerId: string): string => {
        const worker = workerMap.get(workerId);
        if (!worker?.userId) {
          throw new Error(`Worker not found or missing userId: ${workerId}`);
        }
        return worker.userId;
      };

      // Process each group and create assignments
      for (const group of groups || []) {
        // First, ensure the DispatchGroup exists for this project
        let dispatchGroup = await tx.dispatchGroup.findFirst({
          where: { projectId: group.id }
        });

        if (!dispatchGroup) {
          // Create a DispatchGroup linked to the project
          dispatchGroup = await tx.dispatchGroup.create({
            data: {
              name: group.name,
              projectId: group.id,
              location: group.location,
              startTime: group.startTime || "7:00 AM",
              time: group.startTime || "7:00 AM",
              status: "active"
            }
          });
        }

        // Collect all assignments for this group to batch create
        const assignmentsToCreate: any[] = [];

        // Handle special roles
        if (group.projectManager) {
          const userId = getUserIdForWorker(group.projectManager.id);
          assignmentsToCreate.push({
            userId,
            groupId: dispatchGroup.id,
            date,
            status: group.projectManager.status || "pending",
            position: 0,
          });
        }

        if (group.superintendent) {
          const userId = getUserIdForWorker(group.superintendent.id);
          assignmentsToCreate.push({
            userId,
            groupId: dispatchGroup.id,
            date,
            status: group.superintendent.status || "pending",
            position: 1,
          });
        }

        if (group.foreman) {
          const userId = getUserIdForWorker(group.foreman.id);
          assignmentsToCreate.push({
            userId,
            groupId: dispatchGroup.id,
            date,
            status: group.foreman.status || "pending",
            position: 2,
          });
        }

        // Handle regular workers
        let position = 3;
        for (const worker of group.workers || []) {
          const userId = getUserIdForWorker(worker.id);
          assignmentsToCreate.push({
            userId,
            groupId: dispatchGroup.id,
            date,
            status: worker.status || "pending",
            position: position++,
          });
        }

        // Handle crew times
        for (const crewTime of group.crewTimes || []) {
          // First, ensure the crew exists
          let crew = await tx.dispatchCrew.findFirst({
            where: {
              groupId: dispatchGroup.id,
              name: crewTime.name || crewTime.time,
            },
          });

          if (!crew) {
            crew = await tx.dispatchCrew.create({
              data: {
                groupId: dispatchGroup.id,
                name: crewTime.name || crewTime.time,
                startTime: crewTime.time,
              },
            });
          }

          // Add workers to this crew
          for (const worker of crewTime.workers || []) {
            const userId = getUserIdForWorker(worker.id);
            assignmentsToCreate.push({
              userId,
              groupId: dispatchGroup.id,
              crewId: crew.id,
              date,
              status: worker.status || "pending",
              position: position++,
            });
          }
        }

        // OPTIMIZATION: Batch create all assignments for this group
        if (assignmentsToCreate.length > 0) {
          await tx.dispatchAssignment.createMany({
            data: assignmentsToCreate
          });
        }
      }
    });

    console.log('Saved dispatch data to database:', {
      date: dateStr,
      groupCount: groups?.length,
      unassignedCount: unassignedWorkers?.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save dispatch data:", error);
    return NextResponse.json(
      { error: "Failed to save dispatch data" },
      { status: 500 }
    );
  }
}