import { NextResponse } from "next/server";
import { createExcelTemplate } from "@/lib/create-excel-template";

export async function GET() {
  try {
    const buffer = createExcelTemplate();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="project-template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}