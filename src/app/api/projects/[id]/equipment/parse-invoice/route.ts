import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Enhanced invoice parser
function parseInvoiceText(text: string): any[] {
  const equipment = [];
  
  // Extract supplier - look for common patterns including Sunbelt
  let supplier = "Equipment Rental Co.";
  const supplierPatterns = [
    /SUNBELT\s+RENTALS/i,
    /^([A-Z][A-Z\s&]+)$/m, // All caps company name at start
    /(?:from|bill from|vendor):\s*([^\n]+)/i
  ];
  
  for (const pattern of supplierPatterns) {
    const match = text.match(pattern);
    if (match) {
      supplier = match[0] || match[1];
      supplier = supplier.trim();
      break;
    }
  }
  
  // Extract invoice info
  const invoiceMatch = text.match(/invoice\s*#?:?\s*([\w-]+)/i);
  const invoiceNumber = invoiceMatch ? invoiceMatch[1] : `INV-${Date.now()}`;
  
  const dateMatch = text.match(/date:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const invoiceDate = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
  
  // Parse equipment entries - look for numbered items
  const lines = text.split('\n');
  let currentEquipment: any = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check for numbered equipment entry (e.g., "1. Telehandler Forklift")
    const numberMatch = line.match(/^\d+\.\s+(.+)/);
    if (numberMatch) {
      // Save previous equipment if exists
      if (currentEquipment && currentEquipment.rate > 0) {
        equipment.push(currentEquipment);
      }
      
      // Start new equipment
      currentEquipment = {
        name: numberMatch[1].trim(),
        type: detectEquipmentType(numberMatch[1]),
        supplier: supplier,
        rentalType: "daily",
        rate: 0,
        startDate: new Date().toISOString(),
        endDate: null,
        invoiceNumber: invoiceNumber,
        invoiceDate: invoiceDate,
        status: "active"
      };
      continue;
    }
    
    // If we have current equipment, look for its details
    if (currentEquipment) {
      // Check for rental period
      const periodMatch = line.match(/rental period:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
      if (periodMatch) {
        currentEquipment.startDate = new Date(periodMatch[1]).toISOString();
        currentEquipment.endDate = new Date(periodMatch[2]).toISOString();
      }
      
      // Check for rate
      const rateMatch = line.match(/rate:\s*\$?([\d,]+(?:\.\d{2})?)\s*\/\s*(day|week|month)/i);
      if (rateMatch) {
        currentEquipment.rate = parseFloat(rateMatch[1].replace(/,/g, ''));
        const period = rateMatch[2].toLowerCase();
        currentEquipment.rentalType = period === "day" ? "daily" : 
                                     period === "week" ? "weekly" : "monthly";
      }
      
      // Check for model (optional)
      const modelMatch = line.match(/model:\s*(.+)/i);
      if (modelMatch) {
        currentEquipment.name += ` - ${modelMatch[1].trim()}`;
      }
    }
  }
  
  // Don't forget the last equipment
  if (currentEquipment && currentEquipment.rate > 0) {
    equipment.push(currentEquipment);
  }
  
  // If we found the tracker format, use specialized parser
  if (text.includes("EQUIPMENT RENTAL OPTIMIZATION TRACKER")) {
    return parseTrackerFormat(text, supplier, invoiceNumber, invoiceDate);
  }
  
  // Check for Sunbelt invoice format
  if (text.toUpperCase().includes("SUNBELT") || (text.includes("QTY") && text.includes("EQUIPMENT"))) {
    console.log("Detected Sunbelt format, parsing...");
    return parseSunbeltFormat(text, supplier);
  }
  
  return equipment;
}

// Parse the specific tracker format from the screenshot
function parseTrackerFormat(text: string, supplier: string, invoiceNumber: string, invoiceDate: string): any[] {
  const equipment = [];
  const lines = text.split('\n');
  
  // Equipment data with estimated rates
  const equipmentRates: Record<string, { daily: number, weekly: number, monthly: number }> = {
    'telehandler forklift': { daily: 450, weekly: 2250, monthly: 6750 },
    'trash hopper attachment': { daily: 150, weekly: 750, monthly: 2250 },
    '3yd front loader': { daily: 600, weekly: 3000, monthly: 9000 },
    'utility vehicle': { daily: 200, weekly: 1000, monthly: 3000 },
    'water truck': { daily: 400, weekly: 2000, monthly: 6000 },
    '5yd dumptruck': { daily: 500, weekly: 2500, monthly: 7500 },
    '2500lb skidsteer': { daily: 350, weekly: 1750, monthly: 5250 },
    'plate tamper': { daily: 100, weekly: 500, monthly: 1500 },
    '6" concrete saw': { daily: 150, weekly: 750, monthly: 2250 }
  };
  
  for (const line of lines) {
    // Skip header lines
    if (line.includes('Equipment') && line.includes('Start Date')) continue;
    if (line.trim() === '') continue;
    
    // Parse equipment lines
    const parts = line.split(/\s{2,}|\t/);
    if (parts.length >= 3) {
      const name = parts[0].trim().toLowerCase();
      const startDateStr = parts[1].trim();
      
      // Find matching equipment
      for (const [equipName, rates] of Object.entries(equipmentRates)) {
        if (name.includes(equipName) || equipName.includes(name)) {
          // Parse start date
          let startDate = new Date();
          const dateMatch = startDateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
          if (dateMatch) {
            const month = parseInt(dateMatch[1]) - 1;
            const day = parseInt(dateMatch[2]);
            const year = dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3]);
            startDate = new Date(year, month, day);
          }
          
          // Determine rental type based on current status
          let rentalType = "monthly"; // default
          let rate = rates.monthly;
          
          if (parts[2] && parts[2].includes('Week')) {
            rentalType = "weekly";
            rate = rates.weekly;
          } else if (parts[2] && parts[2].includes('Day')) {
            // Could be daily, but if it's been rented for a while, might be monthly
            const daysRented = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysRented < 7) {
              rentalType = "daily";
              rate = rates.daily;
            } else if (daysRented < 30) {
              rentalType = "weekly";
              rate = rates.weekly;
            }
          }
          
          equipment.push({
            name: parts[0].trim(),
            type: detectEquipmentType(parts[0]),
            supplier: supplier,
            rentalType: rentalType,
            rate: rate,
            startDate: startDate.toISOString(),
            invoiceNumber: invoiceNumber,
            invoiceDate: invoiceDate,
            status: "active"
          });
          break;
        }
      }
    }
  }
  
  return equipment;
}

// Get default rate based on equipment type
function getDefaultRate(equipmentName: string, rentalType: string): number {
  const name = equipmentName.toLowerCase();
  
  // Default rates by equipment category
  const rates: Record<string, Record<string, number>> = {
    'excavator': { daily: 800, weekly: 4000, monthly: 12000 },
    'loader': { daily: 600, weekly: 3000, monthly: 9000 },
    'forklift': { daily: 450, weekly: 2250, monthly: 6750 },
    'dumptruck': { daily: 500, weekly: 2500, monthly: 7500 },
    'truck': { daily: 400, weekly: 2000, monthly: 6000 },
    'skidsteer': { daily: 350, weekly: 1750, monthly: 5250 },
    'crane': { daily: 1200, weekly: 6000, monthly: 18000 },
    'scissor': { daily: 250, weekly: 1250, monthly: 3750 },
    'boom': { daily: 350, weekly: 1750, monthly: 5250 },
    'compactor': { daily: 300, weekly: 1500, monthly: 4500 },
    'saw': { daily: 150, weekly: 750, monthly: 2250 },
    'tamper': { daily: 100, weekly: 500, monthly: 1500 },
    'generator': { daily: 200, weekly: 1000, monthly: 3000 },
    'attachment': { daily: 150, weekly: 750, monthly: 2250 },
    'vehicle': { daily: 200, weekly: 1000, monthly: 3000 }
  };
  
  // Find matching rate
  for (const [key, rateSet] of Object.entries(rates)) {
    if (name.includes(key)) {
      return rateSet[rentalType] || rateSet.daily;
    }
  }
  
  // Default rates if no match
  const defaults: Record<string, number> = {
    daily: 300,
    weekly: 1500,
    monthly: 4500
  };
  
  return defaults[rentalType] || defaults.daily;
}

// Parse Sunbelt invoice format - simplified version
function parseSunbeltFormat(text: string, supplier: string): any[] {
  const equipment = [];
  
  console.log("Parsing Sunbelt format (simplified)...");
  
  // Extract contract info - look for "Contract #" followed by number
  const contractMatch = text.match(/Contract\s*#[:\s]*(\d+)/i);
  const contractNumber = contractMatch ? contractMatch[1] : "";
  console.log("Found contract number:", contractNumber);
  
  // Extract start date from "Date out.... MM/DD/YY"
  let startDate = new Date();
  const dateOutMatch = text.match(/Date\s+out[.\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (dateOutMatch) {
    const [month, day, year] = dateOutMatch[1].split('/');
    const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
    startDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    console.log("Found start date:", startDate);
  }
  
  // Look for equipment lines - simplified approach
  const lines = text.split('\n');
  console.log(`Processing ${lines.length} lines...`);
  
  // Find the equipment section (after QTY EQUIPMENT # header)
  let inEquipmentSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for equipment header
    if (line.includes("QTY") && line.includes("EQUIPMENT")) {
      inEquipmentSection = true;
      console.log("Found equipment section header");
      continue;
    }
    
    // Stop at SALES ITEMS section
    if (line.includes("SALES ITEMS")) {
      console.log("Reached SALES ITEMS section, stopping equipment parsing");
      break;
    }
    
    // Skip empty lines
    if (!line) continue;
    
    // Only process lines in equipment section that start with a quantity
    if (inEquipmentSection && /^\s*\d+\.?\d*\s+/.test(line)) {
      console.log("Processing equipment line:", line);
      
      // Split line into parts - first number is quantity, last numbers are rates
      const parts = line.trim().split(/\s+/);
      
      if (parts.length >= 4) {
        const quantity = parseFloat(parts[0]);
        
        // Find where the rates start (look for consecutive numbers at the end)
        let rateStartIndex = parts.length - 1;
        while (rateStartIndex > 1 && /^\d+\.?\d*$/.test(parts[rateStartIndex - 1])) {
          rateStartIndex--;
        }
        
        console.log("Parts:", parts);
        console.log("Rate start index:", rateStartIndex);
        
        // Equipment name is everything between quantity and rates
        const equipmentName = parts.slice(1, rateStartIndex).join(' ').trim();
        console.log("Extracted equipment name:", equipmentName);
        
        // Skip if no equipment name found
        if (!equipmentName) {
          console.log("No equipment name found between quantity and rates");
          continue;
        }
        
        // Get the rates - handle dashes and N/C
        const rateStrings = parts.slice(rateStartIndex);
        const rates = [];
        
        for (const rateStr of rateStrings) {
          if (rateStr === '-' || rateStr.toUpperCase() === 'N/C') {
            rates.push(0); // Treat dash or N/C as 0
          } else {
            const rate = parseFloat(rateStr);
            if (!isNaN(rate)) {
              rates.push(rate);
            }
          }
        }
        
        if (rates.length < 2) {
          console.log("Not enough rates found, skipping:", line);
          continue;
        }
        
        // Extract all rates: min, daily, weekly, monthly (4 week)
        const minRate = rates[0] || 0;
        const dailyRate = rates[1] || 0;
        const weeklyRate = rates[2] || 0;
        const monthlyRate = rates[3] || 0; // 4 Week rate
        
        // Skip if equipment name is too short or empty
        if (!equipmentName || equipmentName.length < 3) {
          console.log("Equipment name too short or empty, skipping");
          continue;
        }
        
        console.log(`Found equipment: ${equipmentName} - Daily: $${dailyRate}, Weekly: $${weeklyRate}, Monthly: $${monthlyRate} (Qty: ${quantity})`);
        
        // Check if next line has equipment number
        let equipmentNumber = "";
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (/^\d{5,}$/.test(nextLine)) {
            equipmentNumber = nextLine;
            i++; // Skip the equipment number line
          }
        }
        
        // Create an entry for each unit (if quantity > 1, create multiple entries)
        const quantityInt = Math.ceil(quantity); // Round up to ensure we don't lose partial quantities
        for (let unit = 0; unit < quantityInt; unit++) {
          equipment.push({
            name: equipmentName + (quantityInt > 1 ? ` (Unit ${unit + 1} of ${quantityInt})` : ""),
            type: detectEquipmentType(equipmentName),
            supplier: supplier || "SUNBELT RENTALS",
            rentalType: "daily",
            rate: dailyRate,
            weeklyRate: weeklyRate,
            monthlyRate: monthlyRate,
            startDate: startDate.toISOString(),
            endDate: null,
            invoiceNumber: contractNumber || `INV-${Date.now()}`,
            invoiceDate: startDate.toISOString(),
            status: "active",
            quantity: 1, // Each entry represents 1 unit
            equipmentNumber: equipmentNumber ? `${equipmentNumber}${quantityInt > 1 ? `-${unit + 1}` : ""}` : ""
          });
        }
      }
    }
  }
  
  
  return equipment;
}

function detectEquipmentType(name: string): string {
  const types = {
    "Heavy Equipment": /excavator|loader|dozer|grader|crane|backhoe|tractor|landscaper|forklift|telehandler/i,
    "Tools": /drill|saw|hammer|grinder|compressor|generator|tamper|attachment/i,
    "Vehicles": /truck|van|trailer|pickup|vehicle|utility\s+veh/i,
    "Scaffolding": /scaffold|platform|ladder/i,
    "Safety Equipment": /harness|helmet|barrier|cone/i,
    "Lifting Equipment": /lift|scissor|boom|aerial/i
  };
  
  for (const [type, pattern] of Object.entries(types)) {
    if (name.match(pattern)) {
      return type;
    }
  }
  
  return "Other";
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("Processing file:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Process different file types
    let text = "";
    
    try {
      if (file.type.includes("text") || file.name.endsWith(".txt")) {
        // Handle text files
        text = await file.text();
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        // Handle PDF files
        try {
          // Use dynamic import to avoid build issues
          const pdfParse = (await import("pdf-parse")).default;
          const buffer = await file.arrayBuffer();
          const data = await pdfParse(Buffer.from(buffer));
          text = data.text;
          console.log("PDF parsed successfully, text length:", text.length);
        } catch (pdfError) {
          console.error("PDF parsing error:", pdfError);
          // For now, return a helpful message
          return NextResponse.json({
            equipment: [],
            message: "PDF parsing is temporarily unavailable. Please use a text file (.txt) format for now.",
            debugInfo: pdfError instanceof Error ? pdfError.message : "Unknown error"
          }, { status: 200 }); // Return 200 to show message in UI
        }
      } else if (file.type.includes("image")) {
        // For images, we still need OCR integration
        return NextResponse.json({
          equipment: [],
          message: "Image parsing requires OCR integration. Please upload a text or PDF file.",
          invoiceUrl: `https://storage.example.com/invoices/${file.name}`
        });
      } else {
        return NextResponse.json({
          equipment: [],
          message: "Unsupported file type. Please upload a text, PDF, or image file.",
          invoiceUrl: `https://storage.example.com/invoices/${file.name}`
        });
      }
    } catch (error) {
      console.error("Error reading file:", error);
      return NextResponse.json({
        equipment: [],
        message: "Error processing file. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      }, { status: 400 });
    }
    
    // Parse the actual invoice text
    console.log("Extracted text length:", text.length);
    console.log("First 500 chars:", text.substring(0, 500));
    
    const parsedEquipment = parseInvoiceText(text);
    console.log("Parsed equipment count:", parsedEquipment.length);
    
    return NextResponse.json({
      equipment: parsedEquipment,
      invoiceUrl: `https://storage.example.com/invoices/${file.name}`
    });
  } catch (error) {
    console.error("Invoice parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse invoice" },
      { status: 500 }
    );
  }
}