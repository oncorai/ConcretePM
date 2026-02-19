import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as XLSX from 'xlsx';

// Use getServerSession without req/res in App Router
async function checkAuth() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function POST(req: NextRequest) {
  console.log('Extract API v2 called');
  
  try {
    // Check auth without passing req
    const session = await checkAuth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log('Session verified, reading form data...');
    
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
    
    let extractedData: any = {
      projectName: "",
      location: "",
      startDate: "",
      phases: []
    };

    // Handle CSV files
    if (file.name.endsWith('.csv')) {
      // Use XLSX to parse CSV properly (handles quoted values with commas)
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const lines = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      // Parse CSV data
      const phases: any = {};
      let projectName = 'Imported Project';
      let location = '';
      let startDate = '';
      let headerRowIndex = -1;
      
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const row = lines[i];
        if (!row || row.length === 0) continue;
        
        const firstCell = row[0] ? row[0].toString().trim() : '';
        if ((firstCell === 'Project Name' || firstCell === 'Project Name:') && row[1]) {
          projectName = row[1].toString();
        } else if ((firstCell === 'Location' || firstCell === 'Location:') && row[1]) {
          location = row[1].toString();
        } else if ((firstCell === 'Start Date' || firstCell === 'Start Date:') && row[1]) {
          startDate = row[1].toString();
        } else if (firstCell === 'Phase' && row[1] && row[1].toString() === 'Subphase') {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex >= 0) {
        for (let i = headerRowIndex + 1; i < lines.length; i++) {
          const row = lines[i];
          if (!row || row.length < 5) continue;
          
          const phase = row[0] ? row[0].toString().trim() : '';
          const subphase = row[1] ? row[1].toString().trim() : '';
          const hours = row[2] ? row[2].toString().trim() : '';
          const quantity = row[3] ? row[3].toString().trim() : '';
          const unit = row[4] ? row[4].toString().trim() : '';
          
          if (phase && subphase) {
            if (!phases[phase]) {
              phases[phase] = {
                name: phase,
                isExpanded: true,
                subPhases: []
              };
            }
            
            phases[phase].subPhases.push({
              name: subphase,
              budgetHours: (hours || '0').toString(),
              budgetQuantity: (quantity || '').toString(),
              unit: unit || 'ea',
              initialHours: '',
              initialQuantity: '',
              isStarted: false
            });
          }
        }
      }
      
      extractedData = {
        projectName,
        location,
        startDate,
        phases: Object.values(phases)
      };
    }
    // Handle Excel files
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Use same parsing logic as CSV
      const phases: any = {};
      let projectName = 'Imported Project';
      let location = '';
      let startDate = '';
      let headerRowIndex = -1;
      
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0) continue;
        
        const firstCell = row[0] ? row[0].toString().trim() : '';
        if ((firstCell === 'Project Name' || firstCell === 'Project Name:') && row[1]) {
          projectName = row[1].toString();
        } else if ((firstCell === 'Location' || firstCell === 'Location:') && row[1]) {
          location = row[1].toString();
        } else if ((firstCell === 'Start Date' || firstCell === 'Start Date:') && row[1]) {
          startDate = row[1].toString();
        } else if (firstCell === 'Phase' && row[1] && row[1].toString() === 'Subphase') {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex >= 0) {
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length < 5) continue;
          
          const phase = row[0] ? row[0].toString().trim() : '';
          const subphase = row[1] ? row[1].toString().trim() : '';
          const hours = row[2] ? row[2].toString().trim() : '';
          const quantity = row[3] ? row[3].toString().trim() : '';
          const unit = row[4] ? row[4].toString().trim() : '';
          
          if (phase && subphase) {
            if (!phases[phase]) {
              phases[phase] = {
                name: phase,
                isExpanded: true,
                subPhases: []
              };
            }
            
            phases[phase].subPhases.push({
              name: subphase,
              budgetHours: (hours || '0').toString(),
              budgetQuantity: (quantity || '').toString(),
              unit: unit || 'ea',
              initialHours: '',
              initialQuantity: '',
              isStarted: false
            });
          }
        }
      }
      
      extractedData = {
        projectName,
        location,
        startDate,
        phases: Object.values(phases)
      };
    }
    else {
      // For other file types, return sample data
      extractedData = {
        projectName: "Sample Project",
        location: "Sample Location",
        startDate: new Date().toISOString().split('T')[0],
        phases: [{
          name: "Sample Phase",
          isExpanded: true,
          subPhases: [{
            name: "Sample Subphase",
            budgetHours: "10",
            budgetQuantity: "100",
            unit: "ft",
            initialHours: "",
            initialQuantity: "",
            isStarted: false
          }]
        }]
      };
    }

    return NextResponse.json(extractedData);
    
  } catch (error) {
    console.error("Error in extract v2:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to extract data",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}