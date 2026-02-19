import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  console.log('Create project with phases API called');
  
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { name, location, startDate, phases } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create the project with phases and subphases
    const project = await prisma.project.create({
      data: {
        name,
        location,
        startDate: new Date(startDate),
        userId: session.user.id,
        phases: {
          create: phases.map((phase: any) => ({
            name: phase.name,
            orderIndex: phase.orderIndex,
            subPhases: {
              create: phase.subPhases.map((subPhase: any) => ({
                name: subPhase.name,
                orderIndex: subPhase.orderIndex,
                budgetHours: subPhase.budgetHours,
                budgetQuantity: subPhase.budgetQuantity,
                unit: subPhase.unit,
                initialHours: subPhase.initialHours || 0,
                initialQuantity: subPhase.initialQuantity,
              })),
            },
          })),
        },
      },
      include: {
        phases: {
          include: {
            subPhases: true,
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project creation error details:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return more detailed error in development
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create project",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}