import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as XLSX from 'xlsx';

// Use getServerSession without req/res in App Router
async function checkAuth() {
  const session = await getServerSession(authOptions);
  return session;
}

interface ParsedCostItem {
  costCode: string;
  phase: string;
  subphase: string;
  quantity: string;
  unit: string;
  budget: string;
  hours: string;
}

// Unit abbreviation mappings - keep as abbreviations for dropdown
const unitMappings: Record<string, string> = {
  'WK': 'wks',
  'LS': 'ea', 
  'SF': 'sf',
  'CY': 'cy',
  'LF': 'ft',
  'TN': 'ea',
  'GL': 'ea',
  'DY': 'ea',
  'EA': 'ea',
  'BG': 'ea',
  'RL': 'ea',
  'HR': 'hr'
};

// Helper function to map units to dropdown-compatible values
const expandUnit = (unit: string): string => {
  if (!unit) return 'ea';
  const trimmed = unit.trim().toUpperCase();
  
  // Map to dropdown-compatible values
  return unitMappings[trimmed] || 'ea';
};

interface ExtractedCostData {
  projectName: string;
  costItems: ParsedCostItem[];
}

function parseNumber(value: any): number {
  if (!value) return 0;
  const strValue = value.toString().trim();
  
  // Handle all Excel error values
  if (strValue === '#N/A' || strValue === '#REF!' || strValue === '#VALUE!' || 
      strValue === '#DIV/0!' || strValue === '#NUM!' || strValue === '#NAME?' || 
      strValue === '#NULL!' || strValue.includes('#')) {
    return 0;
  }
  
  const str = strValue.replace(/[\$,]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseCostSpreadsheetCSV(buffer: Buffer): ExtractedCostData {
  // Use XLSX to parse CSV properly (handles quoted values with commas)
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const lines = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  const costItems: ParsedCostItem[] = [];
  let currentPhase = '';
  let currentSubPhase = '';
  
  // Helper function to clean and format quantity values
  const cleanQuantity = (qty: string): string => {
    if (!qty) return '';
    // Remove quotes and any non-numeric characters except decimal points
    let cleaned = qty.replace(/"/g, '').replace(/[^0-9.-]/g, '');
    // Parse as number and format with commas
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    // Format with thousands separator
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };
  
  // Helper function to clean CSV escaped quotes
  const cleanCSVQuotes = (value: string): string => {
    if (!value) return '';
    // If the value starts and ends with quotes, it's CSV escaped
    if (value.startsWith('"') && value.endsWith('"')) {
      // Remove outer quotes and replace doubled quotes with single quotes
      return value.slice(1, -1).replace(/""/g, '"');
    }
    return value;
  };
  
  // Find the header row - looking for either complex format or simple format
  let dataStartRow = -1;
  let isSimpleFormat = false;
  
  console.log('🔍 Checking CSV format...');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i][0] === 'Column1' && lines[i][1] === 'Column2') {
      console.log('📋 Complex format detected at row:', i);
      dataStartRow = i + 1;
      break;
    }
    // Check for simple format with Phase/Subphase headers
    else if (lines[i][0] === 'Phase' && lines[i][1] === 'Subphase') {
      console.log('✅ Simple format detected at row:', i);
      dataStartRow = i + 1;
      isSimpleFormat = true;
      break;
    }
  }
  
  if (dataStartRow === -1) {
    console.log('❌ No recognized format found');
  }
  
  if (dataStartRow === -1) return {
    projectName: "Imported Cost Sheet",
    costItems: []
  };
  
  // Handle simple format (Phase, Subphase, Budget Hours, Budget Quantity, Unit)
  if (isSimpleFormat) {
    console.log('📊 Simple format detected! Headers found at row:', dataStartRow - 1);
    console.log('Headers:', lines[dataStartRow - 1]);
    
    // Extract project info from header rows
    let projectName = "Imported Cost Sheet";
    for (let i = 0; i < dataStartRow - 1; i++) {
      if (lines[i][0] === 'Project Name' && lines[i][1]) {
        projectName = lines[i][1].toString();
        break;
      }
    }
    
    for (let i = dataStartRow; i < lines.length; i++) {
      const row = lines[i];
      if (!row || row.length < 5) continue;
      
      const phase = row[0]?.toString().trim();
      const subphase = row[1]?.toString().trim();
      const budgetHours = row[2]?.toString().trim();
      const quantity = row[3]?.toString().trim();
      const unit = row[4]?.toString().trim();
      const budgetAmount = row[5]?.toString().trim(); // Optional 6th column
      
      // Debug first few rows
      if (i < dataStartRow + 3) {
        console.log(`Row ${i}:`, {
          phase,
          subphase,
          budgetHours,
          quantity,
          unit,
          budgetAmount
        });
      }
      
      if (phase && subphase) {
        // Format budget amount if present
        let budgetDisplay = '-';
        if (budgetAmount) {
          // Remove $ and commas for parsing
          const cleanAmount = budgetAmount.replace(/[$,]/g, '');
          const amount = parseFloat(cleanAmount);
          if (!isNaN(amount)) {
            budgetDisplay = amount.toLocaleString('en-US', { 
              style: 'currency', 
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            });
          }
        }
        
        costItems.push({
          costCode: '',
          phase: phase,
          subphase: subphase,
          quantity: cleanQuantity(quantity) || '',
          unit: expandUnit(unit),
          budget: budgetDisplay,
          hours: budgetHours || '-'
        });
      }
    }
    
    console.log(`✨ Parsed ${costItems.length} items from simple format`);
    if (costItems.length > 0) {
      console.log('First item:', costItems[0]);
    }
    
    return {
      projectName,
      costItems
    };
  }
  
  // Parse complex format cost items starting from the data row
  for (let i = dataStartRow; i < lines.length; i++) {
    const row = lines[i];
    if (!row || row.length < 40) continue;
    
    const rawCostCode = row[0]?.toString().trim();
    // Ensure cost code is 6 digits with leading zeros
    const costCode = rawCostCode ? rawCostCode.padStart(6, '0') : '';
    const category = cleanCSVQuotes(row[1]?.toString().trim());
    const quantity = cleanQuantity(row[2]?.toString().trim());
    const unit = row[3]?.toString().trim();
    
    // Skip empty rows
    if (!costCode || costCode === '') continue;
    
    // Skip placeholder categories
    if (category && category.match(/^-\s*Category\s*\d+\s*-$/)) continue;
    
    // Check if this is a major phase (ends in 0000)
    if (costCode.endsWith('0000')) {
      // Map phase codes to phase names
      switch(costCode) {
        case '010000': currentPhase = 'General Conditions'; break;
        case '020000': currentPhase = 'Foundation'; break;
        case '030000': currentPhase = 'Flatwork'; break;
        case '040000': currentPhase = 'Structure'; break;
        case '050000': currentPhase = 'Sitework'; break;
        case '060000': currentPhase = 'Misc. Building'; break;
        case '070000': currentPhase = 'Material'; break;
        case '080000': currentPhase = 'Equipment'; break;
        case '090000': currentPhase = 'Subcontractor'; break;
        default: currentPhase = category || 'Unknown';
      }
      continue;
    }
    
    // Check if this is a sub-phase header (last 3 digits are 000)
    if (costCode.substring(3) === '000') {
      currentSubPhase = cleanCSVQuotes(category || '');
      continue;
    }
    
    // Skip if no category
    if (!category || category === '') continue;
    
    // Skip items with placeholder sub-phase names
    if (currentSubPhase && currentSubPhase.match(/^-\s*Subphase\s*\d+\s*-$/)) {
      currentSubPhase = '';
    }
    
    // Try multiple column positions for budget values
    // Column 4: Total Budget in some files
    // Column 10: Labor Budget in some files
    const totalBudget = parseNumber(row[4]); // Column E (Total Budget)
    const laborBudget = parseNumber(row[10]); // Column K (Labor Budget) 
    const laborHours = parseNumber(row[43]) || parseNumber(row[44]) || parseNumber(row[42]); // Labor hours in column 44 (index 43)
    
    // Debug logging for first few items
    if (i < dataStartRow + 5 && category) {
      console.log(`Row ${i} - ${costCode}:`, {
        category,
        totalBudget: row[4],
        laborBudget: row[10],
        laborHours: row[39],
        parsedTotal: totalBudget,
        parsedLabor: laborBudget,
        parsedHours: laborHours
      });
    }
    
    // Always use total budget from column E
    const budgetValue = totalBudget;
    
    // Only include items that have a category and a budget value
    if (category && category !== '' && budgetValue > 0) {
      let subphaseDescription = category;
      
      // Special handling for certain phases
      if (currentPhase === 'General Conditions' || 
          currentPhase === 'Material' || 
          currentPhase === 'Equipment' || 
          currentPhase === 'Subcontractor') {
        subphaseDescription = category;
      } else if (currentSubPhase && category && !currentSubPhase.match(/^-\s*Subphase\s*\d+\s*-$/)) {
        subphaseDescription = `${currentSubPhase} - ${category}`;
      }
      
      costItems.push({
        costCode,
        phase: currentPhase,
        subphase: subphaseDescription,
        quantity: quantity || '',
        unit: expandUnit(unit),
        budget: budgetValue > 0 ? budgetValue.toLocaleString('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }) : '-',
        hours: laborHours > 0 ? laborHours.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }) : '-'
      });
    }
  }
  
  return {
    projectName: "Imported Cost Sheet",
    costItems
  };
}

function parseCostSpreadsheetExcel(jsonData: any[]): ExtractedCostData {
  console.log('🔍 parseCostSpreadsheetExcel called with', jsonData.length, 'rows');
  const costItems: ParsedCostItem[] = [];
  let currentPhase = '';
  let currentSubPhase = '';
  
  // Helper function to clean and format quantity values
  const cleanQuantity = (qty: string): string => {
    if (!qty) return '';
    // Remove quotes and any non-numeric characters except decimal points
    let cleaned = qty.toString().replace(/"/g, '').replace(/[^0-9.-]/g, '');
    // Parse as number and format with commas
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    // Format with thousands separator
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };
  
  // Check if this is simple format
  let isSimpleFormat = false;
  let dataStartRow = -1;
  
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    console.log(`🔍 Row ${i}:`, row.slice(0, 5)); // Show first 5 columns
    if (row[0] === 'Phase' && row[1] === 'Subphase') {
      console.log('✅ Simple format detected at row', i);
      isSimpleFormat = true;
      dataStartRow = i + 1;
      break;
    } else if (row[0] === 'Column1' && row[1] === 'Column2') {
      console.log('✅ Complex format detected at row', i);
      dataStartRow = i + 1;
      break;
    }
  }
  
  console.log('📍 Format detection result:', { isSimpleFormat, dataStartRow });
  
  // Handle simple format
  if (isSimpleFormat) {
    let projectName = "Imported Cost Sheet";
    for (let i = 0; i < dataStartRow - 1; i++) {
      if (jsonData[i][0] === 'Project Name' && jsonData[i][1]) {
        projectName = jsonData[i][1].toString();
        break;
      }
    }
    
    for (let i = dataStartRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 5) continue;
      
      const phase = row[0]?.toString().trim();
      const subphase = row[1]?.toString().trim();
      const budgetHours = row[2]?.toString().trim();
      const quantity = row[3]?.toString().trim();
      const unit = row[4]?.toString().trim();
      const budgetAmount = row[5]?.toString().trim();
      
      if (phase && subphase) {
        let budgetDisplay = '-';
        if (budgetAmount) {
          const cleanAmount = budgetAmount.toString().replace(/[$,]/g, '');
          const amount = parseFloat(cleanAmount);
          if (!isNaN(amount)) {
            budgetDisplay = amount.toLocaleString('en-US', { 
              style: 'currency', 
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            });
          }
        }
        
        costItems.push({
          costCode: '',
          phase: phase,
          subphase: subphase,
          quantity: cleanQuantity(quantity) || '',
          unit: expandUnit(unit),
          budget: budgetDisplay,
          hours: budgetHours || '-'
        });
      }
    }
    
    return {
      projectName,
      costItems
    };
  }
  
  // Helper function to clean CSV escaped quotes
  const cleanCSVQuotes = (value: string): string => {
    if (!value) return '';
    // If the value starts and ends with quotes, it's CSV escaped
    if (value.startsWith('"') && value.endsWith('"')) {
      // Remove outer quotes and replace doubled quotes with single quotes
      return value.slice(1, -1).replace(/""/g, '"');
    }
    return value;
  };
  
  // If we already found data start row, use it. Otherwise look for complex format
  if (dataStartRow === -1) {
    // Find the header row for complex format
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (row[0] === 'Column1' && row[1] === 'Column2') {
        dataStartRow = i + 1;
        break;
      }
    }
  }
  
  if (dataStartRow === -1) return {
    projectName: "Imported Cost Sheet",
    costItems: []
  };
  
  // Parse cost items
  for (let i = dataStartRow; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];
    if (!row || row.length < 40) continue;
    
    const rawCostCode = row[0]?.toString().trim();
    // Ensure cost code is 6 digits with leading zeros
    const costCode = rawCostCode ? rawCostCode.padStart(6, '0') : '';
    const category = cleanCSVQuotes(row[1]?.toString().trim());
    const quantity = cleanQuantity(row[2]?.toString().trim());
    const unit = row[3]?.toString().trim();
    
    // Debug first few rows to see what we're extracting
    if (i < dataStartRow + 5 && costCode && category) {
      console.log(`🔍 Row ${i} extraction:`, {
        costCode,
        category,
        quantity,
        unit,
        rawRow: row.slice(0, 8)
      });
    }
    
    if (!costCode || costCode === '') continue;
    
    // Skip placeholder categories
    if (category && category.match(/^-\s*Category\s*\d+\s*-$/)) continue;
    
    // Check if this is a major phase
    if (costCode.endsWith('0000')) {
      switch(costCode) {
        case '010000': currentPhase = 'General Conditions'; break;
        case '020000': currentPhase = 'Foundation'; break;
        case '030000': currentPhase = 'Flatwork'; break;
        case '040000': currentPhase = 'Structure'; break;
        case '050000': currentPhase = 'Sitework'; break;
        case '060000': currentPhase = 'Misc. Building'; break;
        case '070000': currentPhase = 'Material'; break;
        case '080000': currentPhase = 'Equipment'; break;
        case '090000': currentPhase = 'Subcontractor'; break;
        default: currentPhase = category || 'Unknown';
      }
      continue;
    }
    
    // Check if this is a sub-phase header
    if (costCode.substring(3) === '000') {
      currentSubPhase = category || '';
      continue;
    }
    
    if (!category || category === '') continue;
    
    // Skip items with placeholder sub-phase names
    if (currentSubPhase && currentSubPhase.match(/^-\s*Subphase\s*\d+\s*-$/)) {
      currentSubPhase = '';
    }
    
    const totalBudget = parseNumber(row[4]); // Column E (Total Budget)
    const laborBudget = parseNumber(row[10]); // Column K (Labor Budget) 
    const laborHours = parseNumber(row[43]) || parseNumber(row[44]) || parseNumber(row[42]); // Labor hours in column 44 (index 43)
    
    // Always use total budget from column E
    const budgetValue = totalBudget;
    
    if (category && category !== '') {
      let subphaseDescription = category;
      
      if (currentPhase === 'General Conditions' || 
          currentPhase === 'Material' || 
          currentPhase === 'Equipment' || 
          currentPhase === 'Subcontractor') {
        subphaseDescription = category;
      } else if (currentSubPhase && category && !currentSubPhase.match(/^-\s*Subphase\s*\d+\s*-$/)) {
        subphaseDescription = `${currentSubPhase} - ${category}`;
      }
      
      costItems.push({
        costCode,
        phase: currentPhase,
        subphase: subphaseDescription,
        quantity: quantity || '',
        unit: expandUnit(unit),
        budget: budgetValue > 0 ? budgetValue.toLocaleString('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }) : '-',
        hours: laborHours > 0 ? laborHours.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }) : '-'
      });
    }
  }
  
  return {
    projectName: "Imported Cost Sheet",
    costItems
  };
}

export async function POST(req: NextRequest) {
  console.log('🚀 Extract Cost Data V2 API called');
  
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
      console.log('📊 Processing Excel file');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      console.log('📋 Sheet names:', workbook.SheetNames);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log('📝 First 5 rows of Excel data:', jsonData.slice(0, 5));
      console.log('📏 Total rows in Excel:', jsonData.length);
      extractedData = parseCostSpreadsheetExcel(jsonData);
    }
    else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    console.log('📤 Returning extracted data:', {
      projectName: extractedData.projectName,
      costItemsCount: extractedData.costItems.length,
      firstItem: extractedData.costItems[0]
    });
    return NextResponse.json(extractedData);
    
  } catch (error) {
    console.error("Error in extract cost data v2:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to extract cost data",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}