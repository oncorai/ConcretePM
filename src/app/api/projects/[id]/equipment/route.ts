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

    // Get equipment for the project
    const equipment = await prisma.equipment.findMany({
      where: {
        projectId: (await params).id,
        project: {
          userId: session.user.id,
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Equipment fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const data = await req.json();
    console.log("Equipment POST data:", data);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Create equipment record
    const equipment = await prisma.equipment.create({
      data: {
        projectId: (await params).id,
        name: data.name,
        type: data.type,
        supplier: data.supplier,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        rentalType: data.rentalType,
        rate: data.rate,
        weeklyRate: data.weeklyRate,
        monthlyRate: data.monthlyRate,
        status: data.status || "scheduled",
        location: data.location,
        notes: data.notes,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        invoiceUrl: data.invoiceUrl,
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Equipment creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}