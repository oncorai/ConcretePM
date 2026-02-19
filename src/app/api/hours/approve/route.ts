import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// import { notifyPMForApproval } from "@/lib/dispatch-notifications";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const approvals = await prisma.hoursApproval.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(status && { status })
      },
      include: {
        project: true
      },
      orderBy: {
        weekEnding: 'desc'
      }
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
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

    const { projectId, weekEnding } = await req.json();

    // Calculate week ending date
    const weekEndDate = new Date(weekEnding);
    weekEndDate.setHours(23, 59, 59, 999);
    const weekStartDate = new Date(weekEndDate);
    weekStartDate.setDate(weekStartDate.getDate() - 6);
    weekStartDate.setHours(0, 0, 0, 0);

    // Get all time entries for the project and week
    const dispatchGroups = await prisma.dispatchGroup.findMany({
      where: { projectId },
      include: {
        workerAssignments: {
          where: {
            date: {
              gte: weekStartDate,
              lte: weekEndDate
            }
          },
          include: {
            worker: {
              include: {
                timeEntries: {
                  where: {
                    clockIn: {
                      gte: weekStartDate,
                      lte: weekEndDate
                    },
                    clockOut: {
                      not: null
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Build breakdown of hours by worker
    const breakdown: any[] = [];
    const workerHours = new Map();
    let totalHours = 0;
    let totalAmount = 0;

    dispatchGroups.forEach(group => {
      group.workerAssignments.forEach(assignment => {
        assignment.worker.timeEntries.forEach(entry => {
          if (entry.clockOut) {
            const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);

            if (!workerHours.has(assignment.workerId)) {
              workerHours.set(assignment.workerId, {
                workerId: assignment.workerId,
                name: assignment.worker.name,
                role: assignment.worker.role,
                hours: 0,
                days: new Set(),
                entries: []
              });
            }

            const workerData = workerHours.get(assignment.workerId);
            workerData.hours += hours;
            workerData.days.add(entry.clockIn.toDateString());
            workerData.entries.push({
              date: entry.clockIn,
              hours: hours.toFixed(1),
              location: entry.location
            });

            totalHours += hours;
          }
        });
      });
    });

    // Convert to breakdown array
    workerHours.forEach(workerData => {
      breakdown.push({
        workerId: workerData.workerId,
        name: workerData.name,
        role: workerData.role,
        hours: workerData.hours.toFixed(1),
        days: workerData.days.size,
        entries: workerData.entries,
        // Could add hourly rate and calculate amount here
        amount: workerData.hours * 35 // Example rate
      });
      totalAmount += workerData.hours * 35;
    });

    // Create or update hours approval
    const approval = await prisma.hoursApproval.upsert({
      where: {
        projectId_weekEnding: {
          projectId,
          weekEnding: weekEndDate
        }
      },
      update: {
        totalHours,
        totalWorkers: breakdown.length,
        totalAmount,
        breakdown,
        status: "pending",
        submittedBy: session.user?.email || "",
        submittedAt: new Date()
      },
      create: {
        projectId,
        weekEnding: weekEndDate,
        totalHours,
        totalWorkers: breakdown.length,
        totalAmount,
        breakdown,
        status: "pending",
        submittedBy: session.user?.email || ""
      }
    });

    // Notify PM for approval
    // await notifyPMForApproval(projectId, weekEndDate);

    return NextResponse.json(approval);
  } catch (error) {
    console.error("Error submitting hours for approval:", error);
    return NextResponse.json(
      { error: "Failed to submit hours" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { approvalId, status, notes } = await req.json();

    if (!['approved', 'rejected', 'revised'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const approval = await prisma.hoursApproval.update({
      where: { id: approvalId },
      data: {
        status,
        approvedBy: session.user?.email || "",
        approvedAt: new Date(),
        notes
      }
    });

    return NextResponse.json(approval);
  } catch (error) {
    console.error("Error updating approval:", error);
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
}