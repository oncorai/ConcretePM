import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/buyout?projectId=xxx - Get all buyout items for a project
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

    const buyoutItems = await prisma.buyoutItem.findMany({
      where: { projectId },
      include: {
        category: true,
        quotes: {
          orderBy: { quotedDate: 'desc' },
        },
      },
      orderBy: [
        { category: { orderIndex: 'asc' } },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(buyoutItems)
  } catch (error) {
    console.error('Error fetching buyout items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buyout items' },
      { status: 500 }
    )
  }
}

// POST /api/buyout - Create a new buyout item
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      projectId,
      categoryId,
      description,
      budgetAmount,
      quantity,
      unit,
      notes,
    } = body

    if (!projectId || !categoryId || !description) {
      return NextResponse.json(
        { error: 'projectId, categoryId, and description are required' },
        { status: 400 }
      )
    }

    const buyoutItem = await prisma.buyoutItem.create({
      data: {
        projectId,
        categoryId,
        description,
        budgetAmount: budgetAmount ? parseFloat(budgetAmount) : null,
        quantity: quantity ? parseFloat(quantity) : null,
        unit,
        notes,
        status: 'pending',
      },
      include: {
        category: true,
        quotes: true,
      },
    })

    return NextResponse.json(buyoutItem)
  } catch (error) {
    console.error('Error creating buyout item:', error)
    return NextResponse.json(
      { error: 'Failed to create buyout item' },
      { status: 500 }
    )
  }
}

// PATCH /api/buyout - Update a buyout item
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

    // Parse numeric fields if present
    if (updates.budgetAmount) {
      updates.budgetAmount = parseFloat(updates.budgetAmount)
    }
    if (updates.quantity) {
      updates.quantity = parseFloat(updates.quantity)
    }
    if (updates.awardedAmount) {
      updates.awardedAmount = parseFloat(updates.awardedAmount)
    }

    const buyoutItem = await prisma.buyoutItem.update({
      where: { id },
      data: updates,
      include: {
        category: true,
        quotes: true,
      },
    })

    return NextResponse.json(buyoutItem)
  } catch (error) {
    console.error('Error updating buyout item:', error)
    return NextResponse.json(
      { error: 'Failed to update buyout item' },
      { status: 500 }
    )
  }
}

// DELETE /api/buyout - Delete a buyout item
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

    await prisma.buyoutItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting buyout item:', error)
    return NextResponse.json(
      { error: 'Failed to delete buyout item' },
      { status: 500 }
    )
  }
}
