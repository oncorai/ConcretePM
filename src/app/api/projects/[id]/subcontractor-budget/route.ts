import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Fetch subcontractor budget items for the project
    const subcontractorBudgets = await prisma.subcontractorBudget.findMany({
      where: {
        projectId: projectId
      },
      orderBy: {
        costCode: 'asc'
      }
    });

    return NextResponse.json(subcontractorBudgets);
  } catch (error) {
    console.error("Error fetching subcontractor budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcontractor budgets" },
      { status: 500 }
    );
  }
}