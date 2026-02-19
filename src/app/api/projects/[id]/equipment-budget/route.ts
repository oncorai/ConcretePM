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

    const equipmentBudgets = await prisma.equipmentBudget.findMany({
      where: {
        project: {
          id: (await params).id,
          userId: session.user.id,
        },
      },
      orderBy: {
        costCode: 'asc',
      },
    });

    return NextResponse.json(equipmentBudgets);
  } catch (error) {
    console.error("Error fetching equipment budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment budgets" },
      { status: 500 }
    );
  }
}