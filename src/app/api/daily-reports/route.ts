import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId, date, notes, progress } = await req.json();

    if (!projectId || !date || !progress || progress.length === 0) {
      return NextResponse.json(
        { error: "Project, date, and progress entries are required" },
        { status: 400 }
      );
    }

    // Check if user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if report already exists for this date
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        projectId,
        date: new Date(date),
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "A report already exists for this date" },
        { status: 400 }
      );
    }

    // Create daily report with progress entries
    const report = await prisma.dailyReport.create({
      data: {
        projectId,
        date: new Date(date),
        notes,
        userId: session.user.id,
        progress: {
          create: progress.map((p: any) => ({
            taskId: p.taskId || null,
            subPhaseId: p.subPhaseId || null,
            hoursWorked: p.hoursWorked,
            quantityComplete: p.quantityComplete,
          })),
        },
      },
      include: {
        progress: {
          include: {
            task: true,
            subPhase: true,
          },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Daily report creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}