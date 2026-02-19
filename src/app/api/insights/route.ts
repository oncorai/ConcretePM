import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all tasks with their progress across all projects
    const allTasks = await prisma.task.findMany({
      include: {
        project: true,
        dailyProgress: true,
      },
    });

    // Group tasks by name to calculate averages
    const taskGroups = allTasks.reduce((acc, task) => {
      const taskName = task.name.toLowerCase().trim();
      if (!acc[taskName]) {
        acc[taskName] = {
          name: task.name,
          tasks: [],
          totalBudgetHours: 0,
          totalActualHours: 0,
          totalBudgetQuantity: 0,
          totalActualQuantity: 0,
          count: 0,
          unit: task.unit,
        };
      }
      
      const actualHours = task.initialHours + task.dailyProgress.reduce((sum, p) => sum + p.hoursWorked, 0);
      const actualQuantity = (task.initialQuantity || 0) + task.dailyProgress.reduce((sum, p) => sum + (p.quantityComplete || 0), 0);
      
      acc[taskName].tasks.push(task);
      acc[taskName].totalBudgetHours += task.budgetHours;
      acc[taskName].totalActualHours += actualHours;
      if (task.budgetQuantity) {
        acc[taskName].totalBudgetQuantity += task.budgetQuantity;
        acc[taskName].totalActualQuantity += actualQuantity;
      }
      acc[taskName].count += 1;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate metrics for each task type
    const insights = Object.values(taskGroups).map((group: any) => {
      const avgBudgetHours = group.totalBudgetHours / group.count;
      const avgActualHours = group.totalActualHours / group.count;
      const avgVariance = ((avgActualHours - avgBudgetHours) / avgBudgetHours) * 100;
      
      let avgProductivity = 0;
      if (group.totalActualQuantity > 0 && group.totalActualHours > 0) {
        avgProductivity = group.totalActualQuantity / group.totalActualHours;
      }
      
      return {
        taskName: group.name,
        unit: group.unit,
        count: group.count,
        avgBudgetHours: parseFloat(avgBudgetHours.toFixed(2)),
        avgActualHours: parseFloat(avgActualHours.toFixed(2)),
        avgVariance: parseFloat(avgVariance.toFixed(1)),
        avgProductivity: parseFloat(avgProductivity.toFixed(2)),
      };
    });

    // Get overall project statistics
    const projectStats = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            dailyProgress: true,
          },
        },
      },
    });

    const overallStats = {
      totalProjects: projectStats.length,
      completedProjects: 0,
      avgProjectVariance: 0,
      totalHoursTracked: 0,
    };

    let totalVariance = 0;
    projectStats.forEach(project => {
      const projectBudget = project.tasks.reduce((sum, task) => sum + task.budgetHours, 0);
      const projectActual = project.tasks.reduce((sum, task) => {
        const taskActual = task.initialHours + task.dailyProgress.reduce((s, p) => s + p.hoursWorked, 0);
        return sum + taskActual;
      }, 0);
      
      overallStats.totalHoursTracked += projectActual;
      
      if (projectActual >= projectBudget * 0.9) { // Consider 90% complete as "completed"
        overallStats.completedProjects += 1;
      }
      
      if (projectBudget > 0) {
        totalVariance += ((projectActual - projectBudget) / projectBudget) * 100;
      }
    });

    if (projectStats.length > 0) {
      overallStats.avgProjectVariance = parseFloat((totalVariance / projectStats.length).toFixed(1));
    }

    return NextResponse.json({
      insights,
      overallStats,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("Insights fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}