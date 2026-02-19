import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; progressId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, progressId } = await params;
    const { hoursWorked, quantityComplete } = await request.json();

    // Verify the progress entry belongs to a project the user owns
    const progress = await prisma.dailyProgress.findFirst({
      where: {
        id: progressId,
        dailyReport: {
          project: {
            id: id,
            userId: session.user.id
          }
        }
      }
    });

    if (!progress) {
      return NextResponse.json({ error: 'Progress entry not found' }, { status: 404 });
    }

    // Update the progress entry
    const updated = await prisma.dailyProgress.update({
      where: { id: progressId },
      data: {
        hoursWorked: hoursWorked !== undefined ? parseFloat(hoursWorked.toString()) : undefined,
        quantityComplete: quantityComplete !== undefined ? parseFloat(quantityComplete.toString()) : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; progressId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, progressId } = await params;
    // Verify the progress entry belongs to a project the user owns
    const progress = await prisma.dailyProgress.findFirst({
      where: {
        id: progressId,
        dailyReport: {
          project: {
            id: id,
            userId: session.user.id
          }
        }
      }
    });

    if (!progress) {
      return NextResponse.json({ error: 'Progress entry not found' }, { status: 404 });
    }

    // Delete the progress entry
    await prisma.dailyProgress.delete({
      where: { id: progressId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting progress:', error);
    return NextResponse.json(
      { error: 'Failed to delete progress' },
      { status: 500 }
    );
  }
}