import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays } from "date-fns";

// GET - Load dispatch snapshot for a date or list recent snapshots
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const history = searchParams.get("history");

    // If requesting history, return last 7 days of snapshots
    if (history === "true") {
      const sevenDaysAgo = subDays(new Date(), 7);

      const snapshots = await prisma.dispatchSnapshot.findMany({
        where: {
          date: {
            gte: startOfDay(sevenDaysAgo),
            lte: endOfDay(new Date()),
          },
        },
        select: {
          id: true,
          date: true,
          dispatchSent: true,
          dispatchSentAt: true,
          notes: true,
          savedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          updatedAt: true,
        },
        orderBy: { date: "desc" },
      });

      return NextResponse.json(snapshots);
    }

    // Load specific date's snapshot
    if (date) {
      const targetDate = new Date(date);

      const snapshot = await prisma.dispatchSnapshot.findFirst({
        where: {
          date: {
            gte: startOfDay(targetDate),
            lte: endOfDay(targetDate),
          },
        },
        include: {
          savedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!snapshot) {
        // Try to find the most recent snapshot before this date
        const previousSnapshot = await prisma.dispatchSnapshot.findFirst({
          where: {
            date: {
              lt: startOfDay(targetDate),
            },
          },
          orderBy: { date: "desc" },
        });

        if (previousSnapshot) {
          return NextResponse.json({
            snapshot: null,
            previousSnapshot: {
              date: previousSnapshot.date,
              assignments: previousSnapshot.assignments,
            },
          });
        }

        return NextResponse.json({ snapshot: null, previousSnapshot: null });
      }

      return NextResponse.json({ snapshot });
    }

    return NextResponse.json({ error: "Date parameter required" }, { status: 400 });
  } catch (error) {
    console.error("Failed to load dispatch snapshot:", error);
    return NextResponse.json(
      { error: "Failed to load dispatch snapshot" },
      { status: 500 }
    );
  }
}

// POST - Save dispatch snapshot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { date, assignments, notes, dispatchSent } = body;

    const targetDate = startOfDay(new Date(date));

    // Upsert the snapshot (update if exists, create if not)
    const snapshot = await prisma.dispatchSnapshot.upsert({
      where: {
        date: targetDate,
      },
      create: {
        date: targetDate,
        assignments,
        notes,
        dispatchSent: dispatchSent,
        dispatchSentAt: dispatchSent ? new Date() : null,
        savedById: user.id,
      },
      update: {
        assignments,
        notes,
        dispatchSent: dispatchSent,
        dispatchSentAt: dispatchSent ? new Date() : undefined,
        savedById: user.id,
      },
      include: {
        savedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Failed to save dispatch snapshot:", error);
    return NextResponse.json(
      { error: "Failed to save dispatch snapshot" },
      { status: 500 }
    );
  }
}

// PUT - Copy dispatch from one date to another
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fromDate, toDate } = body;

    const sourceDate = startOfDay(new Date(fromDate));
    const targetDate = startOfDay(new Date(toDate));

    // Get the source snapshot
    const sourceSnapshot = await prisma.dispatchSnapshot.findUnique({
      where: { date: sourceDate },
    });

    if (!sourceSnapshot) {
      return NextResponse.json(
        { error: "Source dispatch not found" },
        { status: 404 }
      );
    }

    // Create or update the target snapshot with the source configuration
    const targetSnapshot = await prisma.dispatchSnapshot.upsert({
      where: {
        date: targetDate,
      },
      create: {
        date: targetDate,
        assignments: sourceSnapshot.assignments as any,
        notes: `Copied from ${fromDate}`,
        dispatchSent: false,
        savedById: user.id,
      },
      update: {
        assignments: sourceSnapshot.assignments as any,
        notes: `Copied from ${fromDate}`,
        dispatchSent: false,
        savedById: user.id,
      },
      include: {
        savedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(targetSnapshot);
  } catch (error) {
    console.error("Failed to copy dispatch:", error);
    return NextResponse.json(
      { error: "Failed to copy dispatch" },
      { status: 500 }
    );
  }
}