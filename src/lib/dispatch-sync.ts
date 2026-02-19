import { prisma } from "@/lib/prisma";

/**
 * Auto-create dispatch group when a new project is created
 */
export async function createDispatchGroupForProject(projectId: string) {
  try {
    // Check if dispatch group already exists
    const existing = await prisma.dispatchGroup.findFirst({
      where: { projectId }
    });

    if (existing) {
      return existing;
    }

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Create dispatch group
    const dispatchGroup = await prisma.dispatchGroup.create({
      data: {
        name: project.name,
        projectId: project.id,
        location: project.location,
        startTime: "7:00 AM",
        time: "7:00 AM",
        status: "active",
        isDeleted: false
      }
    });

    console.log(`✅ Created dispatch group for project: ${project.name}`);
    return dispatchGroup;
  } catch (error) {
    console.error("Error creating dispatch group for project:", error);
    throw error;
  }
}

/**
 * Sync all existing projects to dispatch groups
 */
export async function syncAllProjectsToDispatch() {
  try {
    const projects = await prisma.project.findMany();

    for (const project of projects) {
      await createDispatchGroupForProject(project.id);
    }

    console.log(`✅ Synced ${projects.length} projects to dispatch groups`);
  } catch (error) {
    console.error("Error syncing projects to dispatch:", error);
    throw error;
  }
}