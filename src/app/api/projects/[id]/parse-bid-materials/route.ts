import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Papa from "papaparse";

interface BidItem {
  type: string;
  description: string;
  quantity: string;
  unit: string;
  materialTotal: string;
  costCode: string;
}

interface MaterialPhase {
  costCode: string;
  phaseName: string;
  items: BidItem[];
  totalBudget: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    
    // Parse CSV
    const result = Papa.parse(text, {
      header: false,
      skipEmptyLines: true
    });

    const rows = result.data as string[][];
    const materialPhases = new Map<string, MaterialPhase>();

    // Process each row
    rows.forEach((row, index) => {
      // Skip header rows (first few rows)
      if (index < 5) return;

      // Column mapping:
      // B (1): Type
      // C (2): Description  
      // D (3): Quantity
      // E (4): Unit
      // S (18): Material Total (budget)
      // T (19): Cost Code

      const type = row[1]?.trim();
      const description = row[2]?.trim();
      const quantity = row[3]?.trim();
      const unit = row[4]?.trim();
      const materialTotal = row[18]?.trim();
      const costCode = row[19]?.trim();

      // Only process rows with material budget amount and cost code
      if (materialTotal && costCode && type?.toLowerCase() === 'material') {
        // Parse budget amount - remove $ and commas
        const budgetStr = materialTotal.replace(/[$,]/g, '').trim();
        const budgetAmount = parseFloat(budgetStr) || 0;

        if (budgetAmount > 0) {
          const bidItem: BidItem = {
            type,
            description,
            quantity,
            unit,
            materialTotal,
            costCode
          };

          // Group by cost code
          if (!materialPhases.has(costCode)) {
            // Generate phase name from cost code and first item description
            const phaseName = `${costCode} - ${description}`;
            materialPhases.set(costCode, {
              costCode,
              phaseName,
              items: [],
              totalBudget: 0
            });
          }

          const phase = materialPhases.get(costCode)!;
          phase.items.push(bidItem);
          phase.totalBudget += budgetAmount;
        }
      }
    });

    // Convert map to array and update phase names
    const phasesArray = Array.from(materialPhases.values()).map(phase => {
      // Update phase name to be more descriptive based on items
      if (phase.items.length > 0) {
        // Try to find a common pattern in descriptions
        const descriptions = phase.items.map(item => item.description);
        
        // Look for common keywords
        const keywords = ['forming', 'concrete', 'rebar', 'gravel', 'base', 'vapor', 'dowels'];
        let phaseType = '';
        
        for (const keyword of keywords) {
          if (descriptions.some(desc => desc.toLowerCase().includes(keyword))) {
            phaseType = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            break;
          }
        }

        if (phaseType) {
          phase.phaseName = `${phase.costCode} - ${phaseType} Materials`;
        }
      }
      return phase;
    });

    // Sort by cost code
    phasesArray.sort((a, b) => a.costCode.localeCompare(b.costCode));

    return NextResponse.json({
      success: true,
      phases: phasesArray,
      totalItems: phasesArray.reduce((sum, phase) => sum + phase.items.length, 0),
      totalBudget: phasesArray.reduce((sum, phase) => sum + phase.totalBudget, 0)
    });

  } catch (error) {
    console.error("Error parsing bid materials:", error);
    return NextResponse.json(
      { error: "Failed to parse bid materials" },
      { status: 500 }
    );
  }
}