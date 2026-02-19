import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
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

    // Verify the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
      include: {
        phases: {
          orderBy: {
            orderIndex: 'asc'
          },
          include: {
            subPhases: {
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project.phases);
  } catch (error) {
    console.error("Error fetching phases:", error);
    return NextResponse.json(
      { error: "Failed to fetch phases" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
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

    const body = await request.json();
    const { phases } = body;

    // Verify the project belongs to the user
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

    // Use a transaction to update all phases
    await prisma.$transaction(async (tx) => {
      // Get existing phases
      const existingPhases = await tx.phase.findMany({
        where: { projectId: (await params).id },
        include: { subPhases: true }
      });

      // Delete phases that are no longer in the list
      const newPhaseIds = phases.filter((p: any) => p.id).map((p: any) => p.id);
      const phasesToDelete = existingPhases.filter(p => !newPhaseIds.includes(p.id));
      
      for (const phase of phasesToDelete) {
        await tx.phase.delete({ where: { id: phase.id } });
      }

      // Update or create phases
      for (const phase of phases) {
        if (phase.id) {
          // Update existing phase
          await tx.phase.update({
            where: { id: phase.id },
            data: {
              name: phase.name,
              orderIndex: phase.orderIndex
            }
          });

          // Handle subphases
          const existingSubPhases = existingPhases.find(p => p.id === phase.id)?.subPhases || [];
          const newSubPhaseIds = phase.subPhases.filter((sp: any) => sp.id).map((sp: any) => sp.id);
          const subPhasesToDelete = existingSubPhases.filter(sp => !newSubPhaseIds.includes(sp.id));
          
          // Delete removed subphases
          for (const subPhase of subPhasesToDelete) {
            await tx.subPhase.delete({ where: { id: subPhase.id } });
          }

          // Update or create subphases
          for (const subPhase of phase.subPhases) {
            if (subPhase.id) {
              await tx.subPhase.update({
                where: { id: subPhase.id },
                data: {
                  name: subPhase.name,
                  budgetHours: subPhase.budgetHours,
                  budgetQuantity: subPhase.budgetQuantity,
                  unit: subPhase.unit,
                  orderIndex: subPhase.orderIndex
                }
              });
            } else {
              await tx.subPhase.create({
                data: {
                  phaseId: phase.id,
                  name: subPhase.name,
                  budgetHours: subPhase.budgetHours,
                  budgetQuantity: subPhase.budgetQuantity,
                  unit: subPhase.unit,
                  orderIndex: subPhase.orderIndex
                }
              });
            }
          }
        } else {
          // Create new phase with subphases
          await tx.phase.create({
            data: {
              projectId: (await params).id,
              name: phase.name,
              orderIndex: phase.orderIndex,
              subPhases: {
                create: phase.subPhases.map((sp: any) => ({
                  name: sp.name,
                  budgetHours: sp.budgetHours,
                  budgetQuantity: sp.budgetQuantity,
                  unit: sp.unit,
                  orderIndex: sp.orderIndex
                }))
              }
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating phases:", error);
    return NextResponse.json(
      { error: "Failed to update phases" },
      { status: 500 }
    );
  }
}