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

    // Fetch material budget items for the project
    const materialBudgets = await prisma.materialBudget.findMany({
      where: {
        projectId: projectId
      },
      orderBy: {
        costCode: 'asc'
      }
    });

    return NextResponse.json(materialBudgets);
  } catch (error) {
    console.error("Error fetching material budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch material budgets" },
      { status: 500 }
    );
  }
}