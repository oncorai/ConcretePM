import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Create a new crew for a group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId, name, startTime } = await request.json();

    if (!groupId || !name) {
      return NextResponse.json(
        { error: "Group ID and name are required" },
        { status: 400 }
      );
    }

    const crew = await prisma.dispatchCrew.create({
      data: {
        groupId,
        name,
        startTime: startTime || "7:00 AM",
      },
    });

    return NextResponse.json(crew);
  } catch (error) {
    console.error("Failed to create crew:", error);
    return NextResponse.json(
      { error: "Failed to create crew" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a crew
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Crew ID required" },
        { status: 400 }
      );
    }

    await prisma.dispatchCrew.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete crew:", error);
    return NextResponse.json(
      { error: "Failed to delete crew" },
      { status: 500 }
    );
  }
}