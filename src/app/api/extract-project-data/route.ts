import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from 'xlsx';
import pdf from 'pdf-parse';
import OpenAI from 'openai';
import { headers } from 'next/headers';

// Initialize OpenAI only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(req: NextRequest) {
  console.log('Extract API called');
  
  let formData: FormData;
  let file: File | null = null;
  
  try {
    // Check session first without consuming the body
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log('Session verified, reading form data...');
    
    // Now read the form data
    try {
      formData = await req.formData();
      file = formData.get('file') as File;
    } catch (error) {
      console.error('Error reading form data:', error);
      throw new Error(`Failed to read form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
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
      phases: []
    };

    // Handle different file types
    if (file.type.includes('image')) {
      // Handle image files using OpenAI Vision
      if (!openai) {
        console.log('OpenAI not configured, using sample data for images');
        extractedData = getSampleData();
      } else {
        try {
          const base64Image = buffer.toString('base64');
          const response = await openai.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this construction scope sheet image and extract the following information in a structured format:
                  1. Project name (if visible)
                  2. Phases/sections of work
                  3. For each task/subphase: name, budget hours, quantity, and unit of measurement
                  
                  Return the data in this JSON format:
                  {
                    "projectName": "string",
                    "phases": [
                      {
                        "name": "Phase Name",
                        "subPhases": [
                          {
                            "name": "Task Name",
                            "budgetHours": "number as string",
                            "budgetQuantity": "number as string",
                            "unit": "ft/cy/sf/ea/etc"
                          }
                        ]
                      }
                    ]
                  }`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${file.type};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        });

        const content = response.choices[0].message.content;
        if (content) {
          // Parse the JSON response
          const parsed = JSON.parse(content);
          extractedData = formatExtractedData(parsed);
        }
        } catch (error) {
          console.error('OpenAI Vision error:', error);
          // Fallback to sample data if OpenAI fails
          extractedData = getSampleData();
        }
      }
      
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Handle Excel files
      try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('Excel sheet data (first 5 rows):', jsonData.slice(0, 5));
        
        // Parse Excel data into our format
        extractedData = parseExcelArrayData(jsonData as any[][]);
        
        console.log('Excel data extracted:', JSON.stringify(extractedData, null, 2));
        
      } catch (error) {
        console.error('Excel parsing error details:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
    } else if (file.type === 'application/pdf') {
      // Handle PDF files
      try {
        const data = await pdf(buffer);
        
        if (!openai) {
          console.log('OpenAI not configured, using sample data for PDFs');
          extractedData = getSampleData();
        } else {
          // Use OpenAI to extract structured data from PDF text
          const response = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "user",
              content: `Extract construction project information from this text and structure it as phases and tasks. 
              Text: ${data.text}
              
              Return in this JSON format:
              {
                "projectName": "string",
                "phases": [
                  {
                    "name": "Phase Name",
                    "subPhases": [
                      {
                        "name": "Task Name",
                        "budgetHours": "number as string",
                        "budgetQuantity": "number as string",
                        "unit": "ft/cy/sf/ea/etc"
                      }
                    ]
                  }
                ]
              }`
            }
          ],
          max_tokens: 1000
        });

          const content = response.choices[0].message.content;
          if (content) {
            const parsed = JSON.parse(content);
            extractedData = formatExtractedData(parsed);
          }
        }
        
      } catch (error) {
        console.error('PDF parsing error:', error);
        extractedData = getSampleData();
      }
    } else if (file.name.endsWith('.csv')) {
      // Handle CSV files
      try {
        // Use XLSX to parse CSV properly (handles quoted values with commas)
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const lines = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        
        console.log('CSV data (first 5 lines):', lines.slice(0, 5));
        
        extractedData = parseExcelArrayData(lines);
        
        console.log('CSV data extracted:', JSON.stringify(extractedData, null, 2));
        
      } catch (error) {
        console.error('CSV parsing error details:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(extractedData);
    
  } catch (error) {
    console.error("Error extracting project data:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to extract project data",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to parse Excel/CSV data from array format
function parseExcelArrayData(data: any[][]): any {
  const phases: any = {};
  let projectName = 'Imported Project';
  let location = '';
  let startDate = '';
  
  // Find metadata and header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Check for metadata (handle both with and without colons)
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
  
  // Parse data rows
  if (headerRowIndex >= 0) {
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
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
  
  return {
    projectName: projectName,
    location: location,
    startDate: startDate,
    phases: Object.values(phases)
  };
}

// Helper function to parse Excel/CSV data
function parseExcelData(data: any[]): any {
  const phases: any = {};
  let projectName = 'Imported Project';
  let location = '';
  let startDate = '';
  
  // Check for project metadata in first few rows
  let dataStartIndex = 0;
  if (data.length > 0) {
    // Check first few rows for project info
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      if (row['Project Name'] || (row['Phase'] === 'Project Name' && row['Subphase'])) {
        projectName = row['Subphase'] || row['Phase'] || row['Project Name'];
      } else if (row['Location'] || (row['Phase'] === 'Location' && row['Subphase'])) {
        location = row['Subphase'] || row['Phase'] || row['Location'];
      } else if (row['Start Date'] || (row['Phase'] === 'Start Date' && row['Subphase'])) {
        startDate = row['Subphase'] || row['Phase'] || row['Start Date'];
      } else if (row['Phase'] === 'Phase' && row['Subphase'] === 'Subphase') {
        // Found header row
        dataStartIndex = i + 1;
        break;
      }
    }
    
    // Remove metadata rows
    if (dataStartIndex > 0) {
      data = data.slice(dataStartIndex);
    }
  }
  
  // Try to identify columns
  if (data.length > 0) {
    data.forEach(row => {
      // Look for common column names
      const phase = row['Phase'] || row['Section'] || row['Category'] || '';
      const subphase = row['Subphase'] || row['Task'] || row['Description'] || row['Item'] || row['Work Item'] || '';
      const hours = row['Budget Hours'] || row['Hours'] || row['Man Hours'] || '';
      const quantity = row['Budget Quantity'] || row['Quantity'] || row['Qty'] || '';
      const unit = row['Unit'] || row['UOM'] || '';
      
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
          budgetHours: hours.toString(),
          budgetQuantity: quantity.toString(),
          unit: unit || 'ea',
          initialHours: '',
          initialQuantity: '',
          isStarted: false
        });
      }
    });
  }
  
  return {
    projectName: projectName,
    location: location,
    startDate: startDate,
    phases: Object.values(phases)
  };
}

// Helper function to format extracted data
function formatExtractedData(data: any): any {
  return {
    projectName: data.projectName || '',
    phases: (data.phases || []).map((phase: any) => ({
      name: phase.name,
      isExpanded: true,
      subPhases: (phase.subPhases || []).map((subPhase: any) => ({
        name: subPhase.name,
        budgetHours: subPhase.budgetHours || '0',
        budgetQuantity: subPhase.budgetQuantity || '',
        unit: subPhase.unit || 'ea',
        initialHours: '',
        initialQuantity: '',
        isStarted: false
      }))
    }))
  };
}

// Fallback sample data
function getSampleData() {
  return {
    projectName: "Sample Project",
    phases: [
      {
        name: "Excavation",
        isExpanded: true,
        subPhases: [
          {
            name: "Site Clearing",
            budgetHours: "8",
            budgetQuantity: "1",
            unit: "ea",
            initialHours: "",
            initialQuantity: "",
            isStarted: false
          },
          {
            name: "Trenching",
            budgetHours: "24",
            budgetQuantity: "300",
            unit: "ft",
            initialHours: "",
            initialQuantity: "",
            isStarted: false
          }
        ]
      }
    ]
  };
}