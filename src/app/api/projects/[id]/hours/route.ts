import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Default to current week if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    })();

    // Get dispatch groups for this project
    const dispatchGroups = await prisma.dispatchGroup.findMany({
      where: {
        projectId,
        isDeleted: false
      },
      include: {
        workerAssignments: {
          where: {
            date: {
              gte: start,
              lte: end
            }
          },
          include: {
            worker: {
              include: {
                team: true,
                timeEntries: {
                  where: {
                    clockIn: {
                      gte: start,
                      lte: end
                    }
                  },
                  include: {
                    timeAllocations: {
                      include: {
                        costCode: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Get cost codes for the project
    const costCodes = await prisma.costCode.findMany({
      where: { projectId }
    });

    // Process data for dashboard
    const summary = {
      totalWorkers: new Set(),
      totalHours: 0,
      totalDays: new Set(),
      costCodeBreakdown: new Map(),
      dailyHours: new Map(),
      workerDetails: [] as any[]
    };

    dispatchGroups.forEach(group => {
      group.workerAssignments.forEach(assignment => {
        summary.totalWorkers.add(assignment.workerId);

        const workerHours = {
          workerId: assignment.workerId,
          name: assignment.worker.name,
          role: assignment.worker.role,
          team: assignment.worker.team?.name,
          totalHours: 0,
          days: [] as any[],
          costCodeHours: new Map()
        };

        assignment.worker.timeEntries.forEach(entry => {
          const date = entry.clockIn.toDateString();
          summary.totalDays.add(date);

          if (entry.clockOut) {
            const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
            workerHours.totalHours += hours;
            summary.totalHours += hours;

            // Track daily hours
            if (!summary.dailyHours.has(date)) {
              summary.dailyHours.set(date, 0);
            }
            summary.dailyHours.set(date, summary.dailyHours.get(date)! + hours);

            // Track cost code allocations
            if (entry.timeAllocations.length > 0) {
              entry.timeAllocations.forEach(allocation => {
                const codeKey = allocation.costCode.code;

                if (!summary.costCodeBreakdown.has(codeKey)) {
                  summary.costCodeBreakdown.set(codeKey, {
                    code: allocation.costCode.code,
                    description: allocation.costCode.description,
                    hours: 0,
                    budget: allocation.costCode.budgetHours || 0
                  });
                }

                const codeData = summary.costCodeBreakdown.get(codeKey);
                codeData.hours += allocation.hours;

                if (!workerHours.costCodeHours.has(codeKey)) {
                  workerHours.costCodeHours.set(codeKey, 0);
                }
                workerHours.costCodeHours.set(codeKey,
                  workerHours.costCodeHours.get(codeKey)! + allocation.hours
                );
              });
            }

            workerHours.days.push({
              date: entry.clockIn,
              hours: hours.toFixed(1),
              clockIn: entry.clockIn,
              clockOut: entry.clockOut
            });
          }
        });

        if (workerHours.totalHours > 0) {
          summary.workerDetails.push({
            ...workerHours,
            totalHours: workerHours.totalHours.toFixed(1),
            costCodeHours: Array.from(workerHours.costCodeHours.entries()).map(([code, hours]) => ({
              code,
              hours: hours.toFixed(1)
            }))
          });
        }
      });
    });

    // Get recent approvals
    const recentApprovals = await prisma.hoursApproval.findMany({
      where: { projectId },
      orderBy: { weekEnding: 'desc' },
      take: 4
    });

    // Convert summary data
    const response = {
      projectId,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: {
        totalWorkers: summary.totalWorkers.size,
        totalHours: summary.totalHours.toFixed(1),
        totalDays: summary.totalDays.size,
        avgHoursPerDay: (summary.totalHours / Math.max(summary.totalDays.size, 1)).toFixed(1),
        avgHoursPerWorker: (summary.totalHours / Math.max(summary.totalWorkers.size, 1)).toFixed(1)
      },
      costCodes: {
        available: costCodes,
        breakdown: Array.from(summary.costCodeBreakdown.values()).map(cc => ({
          ...cc,
          hours: cc.hours.toFixed(1),
          percentOfBudget: cc.budget > 0 ? ((cc.hours / cc.budget) * 100).toFixed(1) : null
        }))
      },
      daily: Array.from(summary.dailyHours.entries()).map(([date, hours]) => ({
        date,
        hours: hours.toFixed(1),
        workers: summary.workerDetails.filter(w =>
          w.days.some((d: any) => new Date(d.date).toDateString() === date)
        ).length
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      workers: summary.workerDetails,
      approvals: recentApprovals.map(a => ({
        id: a.id,
        weekEnding: a.weekEnding,
        status: a.status,
        totalHours: a.totalHours,
        totalWorkers: a.totalWorkers,
        totalAmount: a.totalAmount
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching project hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch project hours" },
      { status: 500 }
    );
  }
}