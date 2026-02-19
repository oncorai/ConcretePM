import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// import { generateSuperintendentReport } from "@/lib/dispatch-notifications";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const projectId = searchParams.get("projectId");

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    // Get all dispatch groups with today's assignments
    const dispatchGroups = await prisma.dispatchGroup.findMany({
      where: {
        ...(projectId && { projectId }),
        isDeleted: false,
        workerAssignments: {
          some: {
            date: {
              gte: targetDate,
              lt: nextDay
            }
          }
        }
      },
      include: {
        workerAssignments: {
          where: {
            date: {
              gte: targetDate,
              lt: nextDay
            }
          },
          include: {
            worker: {
              include: {
                team: true,
                timeEntries: {
                  where: {
                    clockIn: {
                      gte: targetDate
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Generate report data
    const report = {
      date: targetDate.toISOString(),
      generatedAt: new Date().toISOString(),
      generatedBy: session.user?.name,
      summary: {
        totalProjects: dispatchGroups.length,
        totalWorkers: 0,
        totalHours: 0,
        workersClocked: 0,
        workersNotClocked: 0
      },
      projects: [] as any[]
    };

    dispatchGroups.forEach(group => {
      const projectReport = {
        id: group.id,
        name: group.name,
        location: group.location,
        startTime: group.time,
        workers: [] as any[],
        summary: {
          totalWorkers: 0,
          presentWorkers: 0,
          totalHours: 0,
          avgHours: 0,
          confirmedCount: 0,
          completedCount: 0
        }
      };

      group.workerAssignments.forEach(assignment => {
        const timeEntry = assignment.worker.timeEntries[0];
        let hours = 0;
        let status = "not_clocked";

        if (timeEntry) {
          if (timeEntry.clockOut) {
            hours = (timeEntry.clockOut.getTime() - timeEntry.clockIn.getTime()) / (1000 * 60 * 60);
            status = "completed";
            projectReport.summary.completedCount++;
          } else {
            hours = (new Date().getTime() - timeEntry.clockIn.getTime()) / (1000 * 60 * 60);
            status = "working";
          }
          projectReport.summary.presentWorkers++;
          report.summary.workersClocked++;
        } else {
          report.summary.workersNotClocked++;
        }

        if (assignment.status === "confirmed") {
          projectReport.summary.confirmedCount++;
        }

        projectReport.workers.push({
          id: assignment.worker.id,
          name: assignment.worker.name,
          role: assignment.worker.role,
          team: assignment.worker.team?.name,
          phone: assignment.worker.phoneNumber,
          assignmentStatus: assignment.status,
          clockStatus: status,
          clockIn: timeEntry?.clockIn,
          clockOut: timeEntry?.clockOut,
          hours: hours.toFixed(1),
          notes: timeEntry?.notes
        });

        projectReport.summary.totalHours += hours;
        projectReport.summary.totalWorkers++;
        report.summary.totalHours += hours;
      });

      if (projectReport.summary.totalWorkers > 0) {
        projectReport.summary.avgHours =
          projectReport.summary.totalHours / projectReport.summary.totalWorkers;
      }

      report.projects.push(projectReport);
      report.summary.totalWorkers += projectReport.summary.totalWorkers;
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating daily report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, date, notes, costCodes } = await req.json();

    // Save daily report with cost codes
    const dailyReport = await prisma.dailyReport.create({
      data: {
        project: {
          connect: { id: projectId }
        },
        date: new Date(date),
        notes,
        weather: "", // Would be filled from weather API
        createdBy: {
          connect: { id: session.user?.id }
        },
        // laborHours: costCodes?.reduce((sum: number, cc: any) => sum + cc.hours, 0) || 0,
        // laborCount: costCodes?.reduce((sum: number, cc: any) => sum + cc.workers, 0) || 0,
        // Store cost codes in JSON field - Field doesn't exist in schema
        // data: {
        //   costCodes: costCodes || []
        // }
      }
    });

    return NextResponse.json(dailyReport);
  } catch (error) {
    console.error("Error saving daily report:", error);
    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 500 }
    );
  }
}