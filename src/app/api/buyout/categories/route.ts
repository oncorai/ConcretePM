import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/buyout/categories - Get all buyout categories
export async function GET() {
  try {
    const categories = await prisma.buyoutCategory.findMany({
      orderBy: { orderIndex: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching buyout categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/buyout/categories - Create a new category
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, orderIndex } = body

    const category = await prisma.buyoutCategory.create({
      data: {
        name,
        orderIndex: orderIndex || 99,
        isDefault: false,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating buyout category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
