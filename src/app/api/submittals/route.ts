import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/submittals?projectId=xxx
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

    const submittals = await prisma.submittal.findMany({
      where: { projectId },
      orderBy: [
        { number: 'asc' },
        { revision: 'asc' },
      ],
    })

    return NextResponse.json(submittals)
  } catch (error) {
    console.error('Error fetching submittals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submittals' },
      { status: 500 }
    )
  }
}

// POST /api/submittals - Create new submittal
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      projectId,
      specSection,
      description,
      submittedTo,
      submittedBy,
      dateRequired,
      buyoutItemId,
      notes,
    } = body

    if (!projectId || !description) {
      return NextResponse.json(
        { error: 'projectId and description are required' },
        { status: 400 }
      )
    }

    // Get next submittal number for this project
    const lastSubmittal = await prisma.submittal.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' },
    })

    const nextNumber = lastSubmittal
      ? String(parseInt(lastSubmittal.number) + 1).padStart(3, '0')
      : '001'

    const submittal = await prisma.submittal.create({
      data: {
        projectId,
        number: nextNumber,
        revision: '0',
        specSection,
        description,
        submittedTo,
        submittedBy,
        dateRequired: dateRequired ? new Date(dateRequired) : null,
        buyoutItemId,
        notes,
        status: 'pending',
      },
    })

    return NextResponse.json(submittal)
  } catch (error) {
    console.error('Error creating submittal:', error)
    return NextResponse.json(
      { error: 'Failed to create submittal' },
      { status: 500 }
    )
  }
}

// PATCH /api/submittals - Update submittal
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
    if (updates.dateSubmitted) {
      updates.dateSubmitted = new Date(updates.dateSubmitted)
    }
    if (updates.dateRequired) {
      updates.dateRequired = new Date(updates.dateRequired)
    }
    if (updates.dateReturned) {
      updates.dateReturned = new Date(updates.dateReturned)
    }

    const submittal = await prisma.submittal.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json(submittal)
  } catch (error) {
    console.error('Error updating submittal:', error)
    return NextResponse.json(
      { error: 'Failed to update submittal' },
      { status: 500 }
    )
  }
}

// DELETE /api/submittals?id=xxx
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

    await prisma.submittal.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submittal:', error)
    return NextResponse.json(
      { error: 'Failed to delete submittal' },
      { status: 500 }
    )
  }
}
