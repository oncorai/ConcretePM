import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rfis?projectId=xxx
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

    const rfis = await prisma.rFI.findMany({
      where: { projectId },
      orderBy: { number: 'asc' },
    })

    return NextResponse.json(rfis)
  } catch (error) {
    console.error('Error fetching RFIs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RFIs' },
      { status: 500 }
    )
  }
}

// POST /api/rfis - Create new RFI
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      projectId,
      subject,
      question,
      from,
      to,
      dateRequired,
      costImpact,
      scheduleImpact,
      impactDays,
      notes,
    } = body

    if (!projectId || !subject || !question) {
      return NextResponse.json(
        { error: 'projectId, subject, and question are required' },
        { status: 400 }
      )
    }

    // Get next RFI number for this project
    const lastRFI = await prisma.rFI.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' },
    })

    const nextNumber = lastRFI
      ? String(parseInt(lastRFI.number) + 1).padStart(3, '0')
      : '001'

    const rfi = await prisma.rFI.create({
      data: {
        projectId,
        number: nextNumber,
        subject,
        question,
        from,
        to,
        dateRequired: dateRequired ? new Date(dateRequired) : null,
        costImpact: costImpact || false,
        scheduleImpact: scheduleImpact || false,
        impactDays: impactDays ? parseInt(impactDays) : null,
        notes,
        status: 'open',
      },
    })

    return NextResponse.json(rfi)
  } catch (error) {
    console.error('Error creating RFI:', error)
    return NextResponse.json(
      { error: 'Failed to create RFI' },
      { status: 500 }
    )
  }
}

// PATCH /api/rfis - Update RFI (including answering)
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

    // Handle date fields
    if (updates.dateRequired) {
      updates.dateRequired = new Date(updates.dateRequired)
    }
    if (updates.dateAnswered) {
      updates.dateAnswered = new Date(updates.dateAnswered)
    }

    // If answering, set dateAnswered and status
    if (updates.answer && !updates.dateAnswered) {
      updates.dateAnswered = new Date()
      updates.status = 'answered'
    }

    // Handle numeric fields
    if (updates.impactDays) {
      updates.impactDays = parseInt(updates.impactDays)
    }
    if (updates.impactAmount) {
      updates.impactAmount = parseFloat(updates.impactAmount)
    }

    const rfi = await prisma.rFI.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json(rfi)
  } catch (error) {
    console.error('Error updating RFI:', error)
    return NextResponse.json(
      { error: 'Failed to update RFI' },
      { status: 500 }
    )
  }
}

// DELETE /api/rfis?id=xxx
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

    await prisma.rFI.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting RFI:', error)
    return NextResponse.json(
      { error: 'Failed to delete RFI' },
      { status: 500 }
    )
  }
}
