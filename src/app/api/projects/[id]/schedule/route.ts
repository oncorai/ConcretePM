import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get schedule for the project
    const schedule = await prisma.projectSchedule.findFirst({
      where: {
        projectId: (await params).id,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        scheduleItems: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Schedule fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete existing schedule if any
    await prisma.projectSchedule.deleteMany({
      where: {
        projectId: (await params).id,
      },
    });

    // Create new schedule
    const schedule = await prisma.projectSchedule.create({
      data: {
        projectId: (await params).id,
        phaseDurations: data.phaseDurations,
        scheduleItems: {
          create: data.scheduleItems.map((item: any) => ({
            subPhaseId: item.subPhaseId,
            subPhaseName: item.subPhaseName,
            phaseName: item.phaseName,
            contractorDays: item.contractorDays,
            plannedDays: item.plannedDays,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            budgetHours: item.budgetHours,
            requiredWorkers: item.requiredWorkers,
            dailyHours: item.dailyHours,
            budgetStatus: item.budgetStatus,
            variance: item.variance,
          })),
        },
      },
      include: {
        scheduleItems: true,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Schedule creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}