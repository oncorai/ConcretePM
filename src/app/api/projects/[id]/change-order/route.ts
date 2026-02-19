import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const { changeOrders } = await req.json();

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

    // Apply change orders to subphases
    const updatePromises = changeOrders.map(async (changeOrder: {
      subPhaseId: string;
      additionalHours: number;
      reason: string;
    }) => {
      // Update the subphase budget hours
      const subPhase = await prisma.subPhase.update({
        where: { id: changeOrder.subPhaseId },
        data: {
          budgetHours: {
            increment: changeOrder.additionalHours
          }
        }
      });

      // Create a change order record for tracking
      await prisma.changeOrder.create({
        data: {
          projectId: (await params).id,
          subPhaseId: changeOrder.subPhaseId,
          additionalHours: changeOrder.additionalHours,
          reason: changeOrder.reason,
          createdById: session.user.id,
        }
      });

      return subPhase;
    });

    await Promise.all(updatePromises);

    // Update project's updatedAt timestamp
    await prisma.project.update({
      where: { id: (await params).id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}