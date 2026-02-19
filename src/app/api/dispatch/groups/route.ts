import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get dispatch groups (which are just projects)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Just get all dispatch groups - don't auto-create them
    const groups = await prisma.dispatchGroup.findMany({
      where: {
        isDeleted: false
      },
      include: {
        crews: {
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST - Disabled (projects should be created in projects dashboard)
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Projects must be created through the Projects dashboard" },
    { status: 400 }
  );
}

// PUT - Update dispatch group settings only (not name or location)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, startTime, status } = body;

    // Only allow updating time and status, not name/location (those come from project)
    const group = await prisma.dispatchGroup.update({
      where: { id },
      data: {
        startTime,
        time: startTime,
        status: status || "active"
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Failed to update group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE - Disabled (projects should be deleted in projects dashboard)
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: "Projects must be deleted through the Projects dashboard" },
    { status: 400 }
  );
}