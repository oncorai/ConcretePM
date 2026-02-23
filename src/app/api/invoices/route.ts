import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/invoices?projectId=xxx
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

    const invoices = await prisma.invoice.findMany({
      where: { projectId },
      orderBy: { invoiceDate: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      projectId,
      invoiceNumber,
      vendorName,
      invoiceDate,
      dueDate,
      amount,
      description,
      category,
      costCode,
      notes,
    } = body

    if (!projectId || !invoiceNumber || !vendorName || !invoiceDate || !amount) {
      return NextResponse.json(
        { error: 'projectId, invoiceNumber, vendorName, invoiceDate, and amount are required' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.create({
      data: {
        projectId,
        invoiceNumber,
        vendorName,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        amount: parseFloat(amount),
        description,
        category,
        costCode,
        notes,
        status: 'pending',
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

// PATCH /api/invoices - Update invoice
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
    if (updates.invoiceDate) updates.invoiceDate = new Date(updates.invoiceDate)
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate)
    if (updates.paidDate) updates.paidDate = new Date(updates.paidDate)
    
    // Handle numeric fields
    if (updates.amount) updates.amount = parseFloat(updates.amount)
    if (updates.paidAmount) updates.paidAmount = parseFloat(updates.paidAmount)

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices?id=xxx
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

    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
