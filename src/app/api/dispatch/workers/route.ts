import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all active dispatch workers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const workers = await prisma.dispatchWorker.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error("Failed to fetch workers:", error);
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

// POST - Create a new dispatch worker
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, workerRole, skills } = body;


    // Clean phone number
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    // MULTI-TENANCY: Check if worker with this phone already exists in THIS organization
    const existing = await prisma.dispatchWorker.findFirst({
      where: {
        phone: cleanPhone,
      },
    });

    if (existing) {
      if (existing.isDeleted) {
        // Reactivate deleted worker
        const worker = await prisma.dispatchWorker.update({
          where: { id: existing.id },
          data: {
            name,
            workerRole,
            skills: skills || [],
            isDeleted: false,
            status: "active",
          },
        });

        // Also update/create Worker record for SMS
        const phoneNumber = cleanPhone.replace('+1', '').replace(/\D/g, '');
        await prisma.worker.upsert({
          where: { phoneNumber },
          create: {
            name,
            phoneNumber,
            role: workerRole,
            skills: skills || [],
            status: 'active'
          },
          update: {
            name,
            role: workerRole,
            skills: skills || [],
            status: 'active'
          }
        });

        return NextResponse.json(worker);
      }
      return NextResponse.json(
        { error: "Worker with this phone number already exists" },
        { status: 400 }
      );
    }

    const worker = await prisma.dispatchWorker.create({
      data: {
        name,
        phone: cleanPhone,
        workerRole,
        skills: skills || [],
      },
    });

    // Also create Worker record for SMS functionality
    // Phone number without +1 prefix for Worker table
    const phoneNumber = cleanPhone.replace('+1', '').replace(/\D/g, '');

    try {
      await prisma.worker.create({
        data: {
          name,
          phoneNumber,
          role: workerRole,
          skills: skills || [],
          status: 'active'
        }
      });
    } catch (err) {
      // Worker might already exist, that's okay
      console.log('Worker already exists for SMS, skipping creation');
    }

    return NextResponse.json(worker);
  } catch (error) {
    console.error("Failed to create worker:", error);
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing dispatch worker
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, phone, workerRole, skills, status } = body;

    const cleanPhone = phone ? phone.replace(/[^\d+]/g, "") : undefined;

    const worker = await prisma.dispatchWorker.update({
      where: { id },
      data: {
        name,
        phone: cleanPhone,
        workerRole,
        skills: skills || [],
        status: status || "active",
      },
    });

    // Also update Worker record for SMS if phone is provided
    if (cleanPhone) {
      const phoneNumber = cleanPhone.replace('+1', '').replace(/\D/g, '');
      await prisma.worker.upsert({
        where: { phoneNumber },
        create: {
          name,
          phoneNumber,
          role: workerRole,
          skills: skills || [],
          status: status || 'active'
        },
        update: {
          name,
          role: workerRole,
          skills: skills || [],
          status: status || 'active'
        }
      });
    }

    return NextResponse.json(worker);
  } catch (error) {
    console.error("Failed to update worker:", error);
    return NextResponse.json(
      { error: "Failed to update worker" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a dispatch worker
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
        { error: "Worker ID required" },
        { status: 400 }
      );
    }

    const worker = await prisma.dispatchWorker.update({
      where: { id },
      data: {
        isDeleted: true,
        status: "deleted",
      },
    });

    return NextResponse.json({ success: true, worker });
  } catch (error) {
    console.error("Failed to delete worker:", error);
    return NextResponse.json(
      { error: "Failed to delete worker" },
      { status: 500 }
    );
  }
}