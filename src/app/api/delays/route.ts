import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/delays?projectId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    const delays = await prisma.delayLog.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(delays)
  } catch (error) {
    console.error('Error fetching delays:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delays' },
      { status: 500 }
    )
  }
}

// POST /api/delays - Create new delay entry
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      projectId,
      date,
      delayType,
      description,
      hoursLost,
      daysLost,
      responsible,
      isExcusable,
      isCompensable,
      rfiId,
      notes,
    } = body

    if (!projectId || !date || !delayType || !description) {
      return NextResponse.json(
        { error: 'projectId, date, delayType, and description are required' },
        { status: 400 }
      )
    }

    const delay = await prisma.delayLog.create({
      data: {
        projectId,
        date: new Date(date),
        delayType,
        description,
        hoursLost: hoursLost ? parseFloat(hoursLost) : null,
        daysLost: daysLost ? parseFloat(daysLost) : null,
        responsible,
        isExcusable: isExcusable || false,
        isCompensable: isCompensable || false,
        rfiId,
        notes,
      },
    })

    return NextResponse.json(delay)
  } catch (error) {
    console.error('Error creating delay:', error)
    return NextResponse.json(
      { error: 'Failed to create delay' },
      { status: 500 }
    )
  }
}

// PATCH /api/delays - Update delay
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    if (updates.date) {
      updates.date = new Date(updates.date)
    }
    if (updates.hoursLost) {
      updates.hoursLost = parseFloat(updates.hoursLost)
    }
    if (updates.daysLost) {
      updates.daysLost = parseFloat(updates.daysLost)
    }

    const delay = await prisma.delayLog.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json(delay)
  } catch (error) {
    console.error('Error updating delay:', error)
    return NextResponse.json(
      { error: 'Failed to update delay' },
      { status: 500 }
    )
  }
}

// DELETE /api/delays?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await prisma.delayLog.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting delay:', error)
    return NextResponse.json(
      { error: 'Failed to delete delay' },
      { status: 500 }
    )
  }
}
