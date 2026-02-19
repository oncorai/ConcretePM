import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as XLSX from 'xlsx';

// Use getServerSession without req/res in App Router
async function checkAuth() {
  const session = await getServerSession(authOptions);
  return session;
}

interface CostItem {
  costCode: string;
  category: string;
  quantity: string;
  unit: string;
  totalBudget: number;
  laborBudget: number;
  materialBudget: number;
  subcontractBudget: number;
  equipmentBudget: number;
  otherBudget: number;
  laborHours: number;
  ctd?: number;
  percentComplete?: number;
}

interface ExtractedCostData {
  projectName: string;
  totalBudget: number;
  costItems: CostItem[];
  summary: {
    totalLabor: number;
    totalMaterial: number;
    totalSubcontract: number;
    totalEquipment: number;
    totalOther: number;
    totalLaborHours: number;
  };
}

function parseNumber(value: any): number {
  if (!value) return 0;
  const str = value.toString().replace(/[\$,]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseCostSpreadsheetCSV(buffer: Buffer): ExtractedCostData {
  // Use XLSX to parse CSV properly (handles quoted values with commas)
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const lines = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  const costItems: CostItem[] = [];
  let totalLabor = 0;
  let totalMaterial = 0;
  let totalSubcontract = 0;
  let totalEquipment = 0;
  let totalOther = 0;
  let totalLaborHours = 0;
  
  // Find the header row - looking for "Cost code" in Column1
  let dataStartRow = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i][0] === 'Column1' && lines[i][1] === 'Column2') {
      dataStartRow = i + 1;
      break;
    }
  }
  
  if (dataStartRow === -1) return {
    projectName: "Imported Cost Sheet",
    totalBudget: 0,
    costItems: [],
    summary: {
      totalLabor: 0,
      totalMaterial: 0,
      totalSubcontract: 0,
      totalEquipment: 0,
      totalOther: 0,
      totalLaborHours: 0
    }
  };
  
  // Parse cost items starting from the data row
  for (let i = dataStartRow; i < lines.length; i++) {
    const row = lines[i];
    if (!row || row.length < 40) continue;
    
    const costCode = row[0]?.toString().trim();
    const category = row[1]?.toString().trim();
    const quantity = row[2]?.toString().trim();
    const unit = row[3]?.toString().trim();
    
    // Skip empty rows or header rows
    if (!costCode || costCode.includes('$') || costCode === '') continue;
    
    // Skip placeholder categories (e.g., "- Category 3 -", "- Category 4 -")
    if (category && category.match(/^-\s*Category\s*\d+\s*-$/)) continue;
    
    // Skip if no category or empty category
    if (!category || category === '') continue;
    
    // Column mapping based on the CSV structure:
    // Column4: Total Budget
    // Column8: Labor Budget
    // Column11: Material Budget
    // Column14: Subcontract Budget
    // Column17: Equipment Budget
    // Column20: Other Budget
    // Column39: Labor Hours
    
    const totalBudget = parseNumber(row[4]);
    const laborBudget = parseNumber(row[10]);
    const materialBudget = parseNumber(row[16]);
    const subcontractBudget = parseNumber(row[22]);
    const equipmentBudget = parseNumber(row[28]);
    const otherBudget = parseNumber(row[34]);
    const laborHours = parseNumber(row[39]);
    
    // Include row if it has a valid cost code and category
    if (costCode && category) {
      costItems.push({
        costCode,
        category,
        quantity: quantity || '',
        unit: unit || '',
        totalBudget,
        laborBudget,
        materialBudget,
        subcontractBudget,
        equipmentBudget,
        otherBudget,
        laborHours
      });
      
      totalLabor += laborBudget;
      totalMaterial += materialBudget;
      totalSubcontract += subcontractBudget;
      totalEquipment += equipmentBudget;
      totalOther += otherBudget;
      totalLaborHours += laborHours;
    }
  }
  
  const totalBudget = totalLabor + totalMaterial + totalSubcontract + totalEquipment + totalOther;
  
  return {
    projectName: "Imported Cost Sheet",
    totalBudget,
    costItems,
    summary: {
      totalLabor,
      totalMaterial,
      totalSubcontract,
      totalEquipment,
      totalOther,
      totalLaborHours
    }
  };
}

function parseCostSpreadsheetExcel(jsonData: any[]): ExtractedCostData {
  const costItems: CostItem[] = [];
  let totalLabor = 0;
  let totalMaterial = 0;
  let totalSubcontract = 0;
  let totalEquipment = 0;
  let totalOther = 0;
  let totalLaborHours = 0;
  
  // Find the header row
  let dataStartRow = -1;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];
    if (row[0] === 'Column1' && row[1] === 'Column2') {
      dataStartRow = i + 1;
      break;
    }
  }
  
  if (dataStartRow === -1) return {
    projectName: "Imported Cost Sheet",
    totalBudget: 0,
    costItems: [],
    summary: {
      totalLabor: 0,
      totalMaterial: 0,
      totalSubcontract: 0,
      totalEquipment: 0,
      totalOther: 0,
      totalLaborHours: 0
    }
  };
  
  // Parse cost items
  for (let i = dataStartRow; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];
    if (!row || row.length < 40) continue;
    
    const costCode = row[0]?.toString().trim();
    const category = row[1]?.toString().trim();
    const quantity = row[2]?.toString().trim();
    const unit = row[3]?.toString().trim();
    
    if (!costCode || costCode.includes('$') || costCode === '') continue;
    
    // Skip placeholder categories (e.g., "- Category 3 -", "- Category 4 -")
    if (category && category.match(/^-\s*Category\s*\d+\s*-$/)) continue;
    
    // Skip if no category or empty category
    if (!category || category === '') continue;
    
    const totalBudget = parseNumber(row[4]);
    const laborBudget = parseNumber(row[10]);
    const materialBudget = parseNumber(row[16]);
    const subcontractBudget = parseNumber(row[22]);
    const equipmentBudget = parseNumber(row[28]);
    const otherBudget = parseNumber(row[34]);
    const laborHours = parseNumber(row[39]);
    
    // Include row if it has a valid cost code and category
    if (costCode && category) {
      costItems.push({
        costCode,
        category,
        quantity: quantity || '',
        unit: unit || '',
        totalBudget,
        laborBudget,
        materialBudget,
        subcontractBudget,
        equipmentBudget,
        otherBudget,
        laborHours
      });
      
      totalLabor += laborBudget;
      totalMaterial += materialBudget;
      totalSubcontract += subcontractBudget;
      totalEquipment += equipmentBudget;
      totalOther += otherBudget;
      totalLaborHours += laborHours;
    }
  }
  
  const totalBudget = totalLabor + totalMaterial + totalSubcontract + totalEquipment + totalOther;
  
  return {
    projectName: "Imported Cost Sheet",
    totalBudget,
    costItems,
    summary: {
      totalLabor,
      totalMaterial,
      totalSubcontract,
      totalEquipment,
      totalOther,
      totalLaborHours
    }
  };
}

export async function POST(req: NextRequest) {
  console.log('Extract Cost Data API called');
  
  try {
    // Check auth
    const session = await checkAuth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Read form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let extractedData: ExtractedCostData;

    // Handle CSV files
    if (file.name.endsWith('.csv')) {
      extractedData = parseCostSpreadsheetCSV(buffer);
    }
    // Handle Excel files
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      extractedData = parseCostSpreadsheetExcel(jsonData);
    }
    else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    return NextResponse.json(extractedData);
    
  } catch (error) {
    console.error("Error in extract cost data:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to extract cost data",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}