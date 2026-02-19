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

    // Get all projects with their performance metrics
    const projects = await prisma.project.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          include: {
            dailyProgress: true,
          },
        },
        phases: {
          include: {
            subPhases: true,
          },
        },
        dailyReports: {
          include: {
            progress: true,
          },
        },
      },
    });

    // Calculate metrics for each project
    const projectMetrics = projects.map(project => {
      try {
      let totalBudgetHours = 0;
      let totalActualHours = 0;
      let totalBudgetQuantity = 0;
      let totalActualQuantity = 0;

      // Check if using new phases/subphases structure
      if (project.phases && project.phases.length > 0) {
        // Use phases/subphases structure
        project.phases.forEach(phase => {
          if (phase.subPhases && phase.subPhases.length > 0) {
            phase.subPhases.forEach(subPhase => {
            totalBudgetHours += subPhase.budgetHours;
            totalBudgetQuantity += subPhase.budgetQuantity || 0;
            
            // Calculate actual hours and quantities from daily reports
            const subPhaseProgress = project.dailyReports ? 
              project.dailyReports.flatMap(report => 
                report.progress ? report.progress.filter(p => p.subPhaseId === subPhase.id) : []
              ) : [];
            
            const subPhaseHours = subPhase.initialHours + 
              subPhaseProgress.reduce((sum, p) => sum + p.hoursWorked, 0);
            const subPhaseQuantity = (subPhase.initialQuantity || 0) + 
              subPhaseProgress.reduce((sum, p) => sum + (p.quantityComplete || 0), 0);
            
            totalActualHours += subPhaseHours;
            totalActualQuantity += subPhaseQuantity;
            });
          }
        });
      } else {
        // Fallback to legacy tasks structure
        totalBudgetHours = project.tasks.reduce((sum, task) => sum + task.budgetHours, 0);
        totalActualHours = project.tasks.reduce((sum, task) => {
          const taskActual = task.initialHours + task.dailyProgress.reduce((s, p) => s + p.hoursWorked, 0);
          return sum + taskActual;
        }, 0);
        totalBudgetQuantity = project.tasks.reduce((sum, task) => sum + (task.budgetQuantity || 0), 0);
        totalActualQuantity = project.tasks.reduce((sum, task) => {
          const taskQuantity = (task.initialQuantity || 0) + task.dailyProgress.reduce((s, p) => s + (p.quantityComplete || 0), 0);
          return sum + taskQuantity;
        }, 0);
      }

      const variance = totalBudgetHours > 0 ? ((totalActualHours - totalBudgetHours) / totalBudgetHours) * 100 : 0;
      const productivity = totalActualQuantity > 0 && totalActualHours > 0 ? totalActualQuantity / totalActualHours : 0;
      const completionRate = totalBudgetHours > 0 ? (totalActualHours / totalBudgetHours) * 100 : 0;
      const isComplete = completionRate >= 90; // Consider 90% as complete

      return {
        id: project.id,
        name: project.name,
        location: project.location,
        userName: project.createdBy.name || 'Anonymous',
        userId: project.createdBy.id,
        isOwnProject: project.userId === session.user.id,
        budgetHours: totalBudgetHours,
        actualHours: totalActualHours,
        variance: parseFloat(variance.toFixed(1)),
        productivity: parseFloat(productivity.toFixed(2)),
        completionRate: parseFloat(completionRate.toFixed(1)),
        isComplete,
        taskCount: project.phases && project.phases.length > 0 
          ? project.phases.reduce((sum, phase) => sum + (phase.subPhases?.length || 0), 0)
          : project.tasks?.length || 0,
        lastUpdate: project.updatedAt || project.createdAt,
      };
      } catch (projectError) {
        console.error(`Error processing project ${project.name}:`, projectError);
        // Return a default metric for this project
        return {
          id: project.id,
          name: project.name,
          location: project.location,
          userName: project.createdBy?.name || 'Anonymous',
          userId: project.userId,
          isOwnProject: project.userId === session?.user?.id,
          budgetHours: 0,
          actualHours: 0,
          variance: 0,
          productivity: 0,
          completionRate: 0,
          isComplete: false,
          taskCount: 0,
          lastUpdate: project.updatedAt || project.createdAt,
        };
      }
    });

    // Create different leaderboard views
    const leaderboards = {
      // Most Efficient Projects (lowest variance, completed projects only)
      mostEfficient: projectMetrics
        .filter(p => p.isComplete && p.variance < 0)
        .sort((a, b) => a.variance - b.variance)
        .slice(0, 10),

      // Highest Productivity
      highestProductivity: projectMetrics
        .filter(p => p.productivity > 0)
        .sort((a, b) => b.productivity - a.productivity)
        .slice(0, 10),

      // Most Under Budget
      mostUnderBudget: projectMetrics
        .filter(p => p.variance < -5) // At least 5% under budget
        .sort((a, b) => a.variance - b.variance)
        .slice(0, 10),

      // Recently Completed
      recentlyCompleted: projectMetrics
        .filter(p => p.isComplete)
        .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
        .slice(0, 10),
    };

    // Get user rankings
    const userMetrics = projects.reduce((acc, project) => {
      try {
      const userId = project.createdBy.id;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: project.createdBy.name || 'Anonymous',
          projectCount: 0,
          completedProjects: 0,
          totalBudgetHours: 0,
          totalActualHours: 0,
          avgVariance: 0,
          avgProductivity: 0,
        };
      }

      const projectData = projectMetrics.find(p => p.id === project.id)!;
      acc[userId].projectCount += 1;
      if (projectData.isComplete) {
        acc[userId].completedProjects += 1;
      }
      acc[userId].totalBudgetHours += projectData.budgetHours;
      acc[userId].totalActualHours += projectData.actualHours;

      return acc;
      } catch (userError) {
        console.error(`Error processing user metrics for project ${project.name}:`, userError);
        return acc;
      }
    }, {} as Record<string, any>);

    // Calculate user averages
    const userRankings = Object.values(userMetrics).map((user: any) => {
      const variance = user.totalBudgetHours > 0 
        ? ((user.totalActualHours - user.totalBudgetHours) / user.totalBudgetHours) * 100 
        : 0;

      return {
        ...user,
        avgVariance: parseFloat(variance.toFixed(1)),
        completionRate: user.projectCount > 0 
          ? parseFloat(((user.completedProjects / user.projectCount) * 100).toFixed(0))
          : 0,
      };
    });

    // Create user leaderboards
    const userLeaderboards = {
      // Most Projects Completed
      mostActive: userRankings
        .filter(u => u.completedProjects > 0)
        .sort((a, b) => b.completedProjects - a.completedProjects)
        .slice(0, 10),

      // Best Average Performance
      bestPerformers: userRankings
        .filter(u => u.completedProjects > 0 && u.avgVariance < 0)
        .sort((a, b) => a.avgVariance - b.avgVariance)
        .slice(0, 10),
    };

    return NextResponse.json({
      allProjects: projectMetrics,
      projectLeaderboards: leaderboards,
      userLeaderboards,
      totalProjects: projects.length,
      totalUsers: Object.keys(userMetrics).length,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("Leaderboards fetch error:", error);
    // Return more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}