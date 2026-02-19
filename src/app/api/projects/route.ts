import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDispatchGroupForProject } from "@/lib/dispatch-sync";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        phases: {
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            subPhases: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
        tasks: true, // Keep for backward compatibility
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Projects fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, location, startDate, tasks } = await req.json();

    if (!name || !tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: "Project name and at least one task are required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        location,
        startDate: new Date(startDate),
        userId: session.user.id,
        tasks: {
          create: tasks.map((task: any) => ({
            name: task.name,
            budgetHours: task.budgetHours,
            budgetQuantity: task.budgetQuantity,
            unit: task.unit,
            initialHours: task.initialHours || 0,
            initialQuantity: task.initialQuantity || null,
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    // Auto-create dispatch group for this project
    await createDispatchGroupForProject(project.id);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}