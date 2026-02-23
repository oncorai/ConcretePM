import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CostItem {
  costCode: string;
  phase: string;
  subphase: string;
  quantity: string;
  unit: string;
  budget: string;
  hours: string;
}

interface CostData {
  projectName: string;
  costItems: CostItem[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    if (!session.user.id) {
      console.error("Session user has no ID:", session.user);
      return NextResponse.json({ error: "Invalid session - Please sign in again" }, { status: 401 });
    }

    // Verify the user exists in the database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!dbUser) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json({ error: "User not found - Please sign in again" }, { status: 401 });
    }

    const costData: CostData = await req.json();
    
    // Group all items by phase (including materials, equipment, subcontractor)
    const allPhases = new Map<string, CostItem[]>();
    
    for (const item of costData.costItems) {
      if (!allPhases.has(item.phase)) {
        allPhases.set(item.phase, []);
      }
      allPhases.get(item.phase)!.push(item);
    }

    // Create the project with ALL phases and subphases
    const project = await prisma.project.create({
      data: {
        name: costData.projectName,
        location: "", // You might want to extract this from the CSV
        startDate: new Date(),
        userId: dbUser.id, // Use the verified database user ID
        phases: {
          create: Array.from(allPhases.entries()).map(([phaseName, items], phaseIndex) => ({
            name: phaseName,
            orderIndex: phaseIndex,
            subPhases: {
              create: items.map((item, subIndex) => {
                // Parse hours - remove commas and handle dash
                const hoursStr = item.hours.replace(/,/g, '');
                const hours = hoursStr === '-' ? 0 : parseFloat(hoursStr) || 0;
                
                // Parse quantity - remove commas
                const quantityStr = item.quantity.replace(/,/g, '');
                const quantity = quantityStr ? parseFloat(quantityStr) || 0 : 0;
                
                // Parse budget - remove $ and commas
                const budgetStr = item.budget.replace(/[$,]/g, '');
                const budget = parseFloat(budgetStr) || 0;
                
                return {
                  name: item.subphase,
                  costCode: item.costCode,
                  budget: budget,
                  budgetHours: hours,
                  budgetQuantity: quantity,
                  unit: item.unit || 'ea',
                  orderIndex: subIndex,
                  initialHours: 0,
                  initialQuantity: 0
                };
              })
            }
          }))
        }
      },
      include: {
        phases: {
          include: {
            subPhases: true
          }
        }
      }
    });

    // Create equipment budget items
    const equipmentItems = costData.costItems.filter(item => 
      item.phase.toLowerCase() === 'equipment'
    );
    
    if (equipmentItems.length > 0) {
      const equipmentBudgetData = equipmentItems.map(item => {
        // Parse budget amount - remove $ and commas
        const budgetStr = item.budget.replace(/[$,]/g, '');
        const budgetAmount = parseFloat(budgetStr) || 0;
        
        // Parse quantity
        const quantityStr = item.quantity.replace(/,/g, '');
        const quantity = parseFloat(quantityStr) || 0;
        
        return {
          projectId: project.id,
          costCode: item.costCode,
          equipmentType: item.subphase,
          quantity: quantity,
          unit: item.unit || 'ea',
          budget: budgetAmount
        };
      });
      
      await prisma.equipmentBudget.createMany({
        data: equipmentBudgetData
      });
    }

    // Create material budget items
    const materialItems = costData.costItems.filter(item => 
      item.phase.toLowerCase() === 'material' || item.phase.toLowerCase() === 'materials'
    );
    
    if (materialItems.length > 0) {
      const materialBudgetData = materialItems.map(item => {
        // Parse budget amount - remove $ and commas
        const budgetStr = item.budget.replace(/[$,]/g, '');
        const budgetAmount = parseFloat(budgetStr) || 0;
        
        // Parse quantity
        const quantityStr = item.quantity.replace(/,/g, '');
        const quantity = parseFloat(quantityStr) || 0;
        
        return {
          projectId: project.id,
          costCode: item.costCode,
          materialType: item.subphase,
          quantity: quantity,
          unit: item.unit || 'ea',
          budget: budgetAmount
        };
      });
      
      await prisma.materialBudget.createMany({
        data: materialBudgetData
      });
    }

    // Create subcontractor budget items
    const subcontractorItems = costData.costItems.filter(item => 
      item.phase.toLowerCase() === 'subcontractor'
    );
    
    if (subcontractorItems.length > 0) {
      const subcontractorBudgetData = subcontractorItems.map(item => {
        // Parse budget amount - remove $ and commas
        const budgetStr = item.budget.replace(/[$,]/g, '');
        const budgetAmount = parseFloat(budgetStr) || 0;
        
        // Parse quantity
        const quantityStr = item.quantity.replace(/,/g, '');
        const quantity = parseFloat(quantityStr) || 0;
        
        return {
          projectId: project.id,
          costCode: item.costCode,
          subcontractorType: item.subphase,
          quantity: quantity,
          unit: item.unit || 'ea',
          budget: budgetAmount
        };
      });
      
      await prisma.subcontractorBudget.createMany({
        data: subcontractorBudgetData
      });
    }

    return NextResponse.json({
      projectId: project.id,
      message: "Project created successfully"
    });
    
  } catch (error) {
    console.error("Error creating project from cost data:", error);
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      console.error("Foreign key error occurred");
      return NextResponse.json(
        { 
          error: "User authentication error. Please sign out and sign in again.",
          details: process.env.NODE_ENV === 'development' ? {
            message: error.message
          } : undefined
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create project",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}