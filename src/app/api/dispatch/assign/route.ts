import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// import { sendAssignmentNotification } from "@/lib/dispatch-notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workerId, groupId, crewId, date: dateStr } = await request.json();

    if (!workerId || !dateStr) {
      return NextResponse.json(
        { error: "Worker ID and date are required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Remove existing assignments for this worker on this date
    await prisma.dispatchAssignment.deleteMany({
      where: {
        userId: workerId,
        date: {
          gte: date,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    // If groupId is provided (not unassigned), create new assignment
    if (groupId) {
      // Get the highest position in the group
      const highestPosition = await prisma.dispatchAssignment.findFirst({
        where: { groupId },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      const newPosition = (highestPosition?.position ?? -1) + 1;

      const assignment = await prisma.dispatchAssignment.create({
        data: {
          userId: workerId,
          groupId,
          crewId: crewId || null,
          date,
          status: "pending",
          position: newPosition,
        },
      });

      // Create worker assignment for SMS system
      const workerAssignment = await prisma.workerAssignment.create({
        data: {
          workerId,
          dispatchGroupId: groupId,
          date,
          status: "pending"
        }
      });

      // Send SMS notification (placeholder for now)
      // await sendAssignmentNotification(workerId, workerAssignment.id, "Project", date);

      return NextResponse.json(assignment);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to assign worker:", error);
    return NextResponse.json(
      { error: "Failed to assign worker" },
      { status: 500 }
    );
  }
}