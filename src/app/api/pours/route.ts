import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/pours?projectId=xxx
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

    const pours = await prisma.pourLog.findMany({
      where: { projectId },
      orderBy: { pourDate: 'desc' },
    })

    return NextResponse.json(pours)
  } catch (error) {
    console.error('Error fetching pours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pours' },
      { status: 500 }
    )
  }
}

// POST /api/pours - Create new pour log
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      projectId,
      pourDate,
      pourNumber,
      location,
      element,
      mixDesign,
      supplier,
      ticketNumbers,
      orderedCY,
      placedCY,
      returnedCY,
      startTime,
      endTime,
      slump,
      airContent,
      temperature,
      cylindersTaken,
      weather,
      ambientTemp,
      crewSize,
      notes,
    } = body

    if (!projectId || !pourDate || !location) {
      return NextResponse.json(
        { error: 'projectId, pourDate, and location are required' },
        { status: 400 }
      )
    }

    // Auto-generate pour number if not provided
    let finalPourNumber = pourNumber
    if (!finalPourNumber) {
      const lastPour = await prisma.pourLog.findFirst({
        where: { projectId },
        orderBy: { pourDate: 'desc' },
      })
      const count = lastPour ? parseInt(lastPour.pourNumber?.replace('Pour ', '') || '0') + 1 : 1
      finalPourNumber = `Pour ${count}`
    }

    const pour = await prisma.pourLog.create({
      data: {
        projectId,
        pourDate: new Date(pourDate),
        pourNumber: finalPourNumber,
        location,
        element,
        mixDesign,
        supplier,
        ticketNumbers,
        orderedCY: orderedCY ? parseFloat(orderedCY) : null,
        placedCY: placedCY ? parseFloat(placedCY) : null,
        returnedCY: returnedCY ? parseFloat(returnedCY) : null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        slump,
        airContent,
        temperature,
        cylindersTaken: cylindersTaken ? parseInt(cylindersTaken) : null,
        weather,
        ambientTemp,
        crewSize: crewSize ? parseInt(crewSize) : null,
        notes,
      },
    })

    return NextResponse.json(pour)
  } catch (error) {
    console.error('Error creating pour:', error)
    return NextResponse.json(
      { error: 'Failed to create pour' },
      { status: 500 }
    )
  }
}

// PATCH /api/pours - Update pour
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

    // Handle date/time fields
    if (updates.pourDate) updates.pourDate = new Date(updates.pourDate)
    if (updates.startTime) updates.startTime = new Date(updates.startTime)
    if (updates.endTime) updates.endTime = new Date(updates.endTime)
    
    // Handle numeric fields
    if (updates.orderedCY) updates.orderedCY = parseFloat(updates.orderedCY)
    if (updates.placedCY) updates.placedCY = parseFloat(updates.placedCY)
    if (updates.returnedCY) updates.returnedCY = parseFloat(updates.returnedCY)
    if (updates.cylindersTaken) updates.cylindersTaken = parseInt(updates.cylindersTaken)
    if (updates.crewSize) updates.crewSize = parseInt(updates.crewSize)

    const pour = await prisma.pourLog.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json(pour)
  } catch (error) {
    console.error('Error updating pour:', error)
    return NextResponse.json(
      { error: 'Failed to update pour' },
      { status: 500 }
    )
  }
}

// DELETE /api/pours?id=xxx
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

    await prisma.pourLog.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pour:', error)
    return NextResponse.json(
      { error: 'Failed to delete pour' },
      { status: 500 }
    )
  }
}
