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

    // Get the specific project
    const project = await prisma.project.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
      include: {
        tasks: {
          include: {
            dailyProgress: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get all similar tasks from other projects for comparison
    const taskNames = project.tasks.map(t => t.name.toLowerCase().trim());
    
    const industryTasks = await prisma.task.findMany({
      where: {
        NOT: {
          projectId: project.id,
        },
      },
      include: {
        dailyProgress: true,
        project: true,
      },
    });

    // Group industry tasks by name
    const industryBenchmarks = industryTasks.reduce((acc, task) => {
      const taskName = task.name.toLowerCase().trim();
      if (taskNames.includes(taskName)) {
        if (!acc[taskName]) {
          acc[taskName] = {
            tasks: [],
            totalBudgetHours: 0,
            totalActualHours: 0,
            totalQuantity: 0,
            count: 0,
          };
        }
        
        const actualHours = task.initialHours + task.dailyProgress.reduce((sum, p) => sum + p.hoursWorked, 0);
        const actualQuantity = (task.initialQuantity || 0) + task.dailyProgress.reduce((sum, p) => sum + (p.quantityComplete || 0), 0);
        
        acc[taskName].tasks.push(task);
        acc[taskName].totalBudgetHours += task.budgetHours;
        acc[taskName].totalActualHours += actualHours;
        acc[taskName].totalQuantity += actualQuantity;
        acc[taskName].count += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate project metrics and comparisons
    const comparisons = project.tasks.map(task => {
      const taskName = task.name.toLowerCase().trim();
      const actualHours = task.initialHours + task.dailyProgress.reduce((sum, p) => sum + p.hoursWorked, 0);
      const actualQuantity = (task.initialQuantity || 0) + task.dailyProgress.reduce((sum, p) => sum + (p.quantityComplete || 0), 0);
      const variance = ((actualHours - task.budgetHours) / task.budgetHours) * 100;
      const productivity = actualQuantity > 0 && actualHours > 0 ? actualQuantity / actualHours : 0;

      const industryData = industryBenchmarks[taskName];
      let industryAvgVariance = null;
      let industryAvgProductivity = null;
      let performanceRank = null;

      if (industryData && industryData.count > 0) {
        const industryAvgBudget = industryData.totalBudgetHours / industryData.count;
        const industryAvgActual = industryData.totalActualHours / industryData.count;
        industryAvgVariance = ((industryAvgActual - industryAvgBudget) / industryAvgBudget) * 100;
        
        if (industryData.totalQuantity > 0 && industryData.totalActualHours > 0) {
          industryAvgProductivity = industryData.totalQuantity / industryData.totalActualHours;
        }

        // Calculate performance rank (1 = best)
        const allVariances = industryData.tasks.map((t: any) => {
          const tActual = t.initialHours + t.dailyProgress.reduce((sum: number, p: any) => sum + p.hoursWorked, 0);
          return ((tActual - t.budgetHours) / t.budgetHours) * 100;
        });
        allVariances.push(variance);
        allVariances.sort((a: number, b: number) => a - b);
        performanceRank = allVariances.indexOf(variance) + 1;
      }

      return {
        taskName: task.name,
        unit: task.unit,
        budgetHours: task.budgetHours,
        actualHours: parseFloat(actualHours.toFixed(2)),
        variance: parseFloat(variance.toFixed(1)),
        productivity: parseFloat(productivity.toFixed(2)),
        industryAvgVariance: industryAvgVariance ? parseFloat(industryAvgVariance.toFixed(1)) : null,
        industryAvgProductivity: industryAvgProductivity ? parseFloat(industryAvgProductivity.toFixed(2)) : null,
        industryCount: industryData?.count || 0,
        performanceRank,
        totalInComparison: (industryData?.count || 0) + 1,
      };
    });

    // Calculate overall project performance
    const projectBudget = project.tasks.reduce((sum, t) => sum + t.budgetHours, 0);
    const projectActual = comparisons.reduce((sum, c) => sum + c.actualHours, 0);
    const projectVariance = ((projectActual - projectBudget) / projectBudget) * 100;

    // Get industry average for overall projects
    const allProjects = await prisma.project.findMany({
      where: {
        NOT: {
          id: project.id,
        },
      },
      include: {
        tasks: {
          include: {
            dailyProgress: true,
          },
        },
      },
    });

    let industryProjectVariances: number[] = [];
    allProjects.forEach(p => {
      const pBudget = p.tasks.reduce((sum, t) => sum + t.budgetHours, 0);
      const pActual = p.tasks.reduce((sum, t) => {
        const tActual = t.initialHours + t.dailyProgress.reduce((s, dp) => s + dp.hoursWorked, 0);
        return sum + tActual;
      }, 0);
      if (pBudget > 0) {
        industryProjectVariances.push(((pActual - pBudget) / pBudget) * 100);
      }
    });

    const industryAvgProjectVariance = industryProjectVariances.length > 0
      ? industryProjectVariances.reduce((sum, v) => sum + v, 0) / industryProjectVariances.length
      : null;

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        location: project.location,
        startDate: project.startDate,
      },
      comparisons,
      summary: {
        projectVariance: parseFloat(projectVariance.toFixed(1)),
        industryAvgVariance: industryAvgProjectVariance ? parseFloat(industryAvgProjectVariance.toFixed(1)) : null,
        betterThanPercent: industryProjectVariances.length > 0
          ? parseFloat(((industryProjectVariances.filter(v => v > projectVariance).length / industryProjectVariances.length) * 100).toFixed(0))
          : null,
      },
    });
  } catch (error) {
    console.error("Benchmark fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}