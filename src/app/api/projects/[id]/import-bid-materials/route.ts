import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface BidItem {
  type: string;
  description: string;
  quantity: string;
  unit: string;
  materialTotal: string;
  costCode: string;
}

interface MaterialPhase {
  costCode: string;
  phaseName: string;
  items: BidItem[];
  totalBudget: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { phases } = await req.json();

    if (!phases || !Array.isArray(phases)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Delete existing material budgets for this project to avoid duplicates
    await prisma.materialBudget.deleteMany({
      where: {
        projectId: projectId
      }
    });

    // Prepare material budget data
    const materialBudgetData = [];
    
    for (const phase of phases) {
      for (const item of phase.items) {
        // Parse quantity - remove commas
        const quantityStr = item.quantity.replace(/,/g, '');
        const quantity = parseFloat(quantityStr) || 0;
        
        // Parse budget amount - remove $ and commas
        const budgetStr = item.materialTotal.replace(/[$,]/g, '').trim();
        const budgetAmount = parseFloat(budgetStr) || 0;
        
        materialBudgetData.push({
          projectId: projectId,
          costCode: item.costCode,
          materialType: item.description,
          quantity: quantity,
          unit: item.unit || 'EA',
          budget: budgetAmount
        });
      }
    }

    // Create all material budget items
    await prisma.materialBudget.createMany({
      data: materialBudgetData
    });

    return NextResponse.json({
      success: true,
      itemsCreated: materialBudgetData.length,
      message: "Materials imported successfully"
    });

  } catch (error) {
    console.error("Error importing bid materials:", error);
    return NextResponse.json(
      { 
        error: "Failed to import bid materials",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
}