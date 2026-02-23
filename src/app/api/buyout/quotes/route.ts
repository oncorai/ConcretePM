import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/buyout/quotes - Add a quote to a buyout item
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      buyoutItemId,
      supplierName,
      supplierContact,
      supplierPhone,
      supplierEmail,
      quotedAmount,
      validUntil,
      notes,
    } = body

    if (!buyoutItemId || !supplierName || !quotedAmount) {
      return NextResponse.json(
        { error: 'buyoutItemId, supplierName, and quotedAmount are required' },
        { status: 400 }
      )
    }

    const quote = await prisma.buyoutQuote.create({
      data: {
        buyoutItemId,
        supplierName,
        supplierContact,
        supplierPhone,
        supplierEmail,
        quotedAmount: parseFloat(quotedAmount),
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
      },
    })

    // Update buyout item status to "quoted"
    await prisma.buyoutItem.update({
      where: { id: buyoutItemId },
      data: { status: 'quoted' },
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}

// PATCH /api/buyout/quotes - Award a quote (mark as winner)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { quoteId, action } = body

    if (!quoteId || action !== 'award') {
      return NextResponse.json(
        { error: 'quoteId and action=award are required' },
        { status: 400 }
      )
    }

    // Get the quote
    const quote = await prisma.buyoutQuote.findUnique({
      where: { id: quoteId },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Mark all other quotes for this item as not winner
    await prisma.buyoutQuote.updateMany({
      where: { buyoutItemId: quote.buyoutItemId },
      data: { isWinner: false },
    })

    // Mark this quote as winner
    await prisma.buyoutQuote.update({
      where: { id: quoteId },
      data: { isWinner: true },
    })

    // Update buyout item with awarded info
    await prisma.buyoutItem.update({
      where: { id: quote.buyoutItemId },
      data: {
        awardedQuoteId: quoteId,
        awardedAmount: quote.quotedAmount,
        awardedDate: new Date(),
        status: 'awarded',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error awarding quote:', error)
    return NextResponse.json(
      { error: 'Failed to award quote' },
      { status: 500 }
    )
  }
}

// DELETE /api/buyout/quotes?id=xxx - Delete a quote
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

    await prisma.buyoutQuote.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}
