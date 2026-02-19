import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    const project = await prisma.project.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
      include: {
        phases: {
          orderBy: { orderIndex: 'asc' },
          include: {
            subPhases: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
        equipment: {
          orderBy: { startDate: 'desc' }
        },
        dailyReports: {
          orderBy: { date: 'desc' },
          include: {
            progress: {
              include: {
                subPhase: true
              }
            }
          }
        }
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Calculate totals exactly as in the dashboard
    let totalBudgetHours = 0;
    let totalInitialHours = 0;
    let projectedTotalHours = 0;
    
    project.phases.forEach(phase => {
      phase.subPhases.forEach(subPhase => {
        totalBudgetHours += subPhase.budgetHours;
        totalInitialHours += subPhase.initialHours;
      });
    });
    
    const totalDailyHours = project.dailyReports.reduce((sum, report) => 
      sum + report.progress.reduce((taskSum, progress) => taskSum + progress.hoursWorked, 0), 0
    );
    const totalActualHours = totalInitialHours + totalDailyHours;
    const percentComplete = totalBudgetHours > 0 ? (totalActualHours / totalBudgetHours) * 100 : 0;
    
    // Calculate projected hours for each subphase
    project.phases.forEach(phase => {
      phase.subPhases.forEach(subPhase => {
        const subPhaseDailyQuantity = project.dailyReports.reduce((sum, report) => 
          sum + report.progress
            .filter(p => p.subPhaseId === subPhase.id)
            .reduce((pSum, p) => pSum + (p.quantityComplete || 0), 0), 0
        );
        
        const subPhaseTotalQuantity = (subPhase.initialQuantity || 0) + subPhaseDailyQuantity;
        const subPhaseTotalHours = subPhase.initialHours + project.dailyReports.reduce((sum, report) => 
          sum + report.progress
            .filter(p => p.subPhaseId === subPhase.id)
            .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
        );
        
        if (subPhase.budgetQuantity && subPhase.budgetQuantity > 0 && subPhaseTotalQuantity > 0 && subPhaseTotalHours > 0) {
          const actualProductionRate = subPhaseTotalHours / subPhaseTotalQuantity;
          projectedTotalHours += actualProductionRate * subPhase.budgetQuantity;
        } else {
          projectedTotalHours += subPhase.budgetHours;
        }
      });
    });

    // Calculate days rented helper
    const calculateDaysRented = (startDate: string, endDate?: string) => {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    };

    // Calculate equipment costs with proper billing cycles
    const calculateTotalCost = (equipment: any) => {
      const totalDays = calculateDaysRented(equipment.startDate, equipment.endDate);
      const dailyRate = equipment.rate || 0;
      const weeklyRate = equipment.weeklyRate || dailyRate * 7;
      const monthlyRate = equipment.monthlyRate || dailyRate * 28;
      
      let totalCost = 0;
      let remainingDays = totalDays;
      
      if (remainingDays >= 28) {
        const months = Math.floor(remainingDays / 28);
        totalCost += months * monthlyRate;
        remainingDays = remainingDays % 28;
      }
      
      if (remainingDays >= 21) {
        totalCost += monthlyRate;
        remainingDays = 0;
      } else if (remainingDays >= 7) {
        const weeks = Math.floor(remainingDays / 7);
        totalCost += weeks * weeklyRate;
        remainingDays = remainingDays % 7;
        
        if (remainingDays >= 3 && dailyRate * 3 >= weeklyRate) {
          totalCost += weeklyRate;
          remainingDays = 0;
        }
      } else if (remainingDays >= 3 && dailyRate * 3 >= weeklyRate) {
        totalCost += weeklyRate;
        remainingDays = 0;
      }
      
      if (remainingDays > 0) {
        totalCost += remainingDays * dailyRate;
      }
      
      return totalCost;
    };

    const activeEquipment = project.equipment?.filter((eq: any) => eq.status === "active") || [];
    const totalEquipmentSpent = project.equipment?.reduce((sum: number, eq: any) => sum + calculateTotalCost(eq), 0) || 0;

    // Equipment budgets by type
    const equipmentBudgets: Record<string, number> = {
      "Excavation": 45000,
      "Forklift": 28653,
      "Skidsteer": 3080,
      "Water Truck": 10587
    };

    // Build equipment spend data by type
    const equipmentByType: Record<string, {spent: number, budget: number, active: number, returned: number}> = {};
    
    project.equipment.forEach((eq: any) => {
      const type = eq.type || eq.name || 'Other';
      if (!equipmentByType[type]) {
        equipmentByType[type] = {
          spent: 0,
          budget: equipmentBudgets[type] || 0,
          active: 0,
          returned: 0
        };
      }
      equipmentByType[type].spent += calculateTotalCost(eq);
      if (eq.status === 'active') {
        equipmentByType[type].active++;
      } else {
        equipmentByType[type].returned++;
      }
    });

    // Calculate pie chart data
    const pieData = Object.entries(equipmentByType)
      .map(([name, data]) => ({
        name,
        value: data.spent,
        percentage: totalEquipmentSpent > 0 ? (data.spent / totalEquipmentSpent * 100).toFixed(1) : "0"
      }))
      .sort((a, b) => b.value - a.value);

    const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    // Generate equipment recommendations
    const getRecommendation = (equipment: any) => {
      const daysRented = calculateDaysRented(equipment.startDate);
      const dailyRate = equipment.rate || 0;
      const weeklyRate = equipment.weeklyRate || dailyRate * 7;
      const monthlyRate = equipment.monthlyRate || dailyRate * 28;
      
      if (daysRented <= 7) {
        const monthlyDiff = monthlyRate - weeklyRate;
        const extraDays = 21;
        return `Week 1 active<br><span style="color: #9ca3af; font-size: 12px;">Consider monthly: +$${monthlyDiff} for ${extraDays} more days ($${(monthlyDiff/extraDays).toFixed(0)}/day for extra time)</span>`;
      } else if (daysRented <= 14) {
        const currentWeeks = Math.ceil(daysRented/7);
        const currentCost = weeklyRate * currentWeeks;
        const monthlyDiff = monthlyRate - currentCost;
        const extraDays = 28 - (currentWeeks * 7);
        
        if (monthlyDiff > 0 && extraDays > 0) {
          return `Consider monthly upgrade<br><span style="color: #9ca3af; font-size: 12px;">+$${monthlyDiff} for ${extraDays} more days ($${(monthlyDiff/extraDays).toFixed(0)}/day for extra time)</span>`;
        }
        return `Week ${currentWeeks} active<br><span style="color: #9ca3af; font-size: 12px;">Weekly rate in effect</span>`;
      } else if (daysRented <= 28) {
        return 'Month 1 rate triggered<br><span style="color: #9ca3af; font-size: 12px;">Monthly billing is most cost effective</span>';
      }
      
      const months = Math.floor(daysRented / 28);
      return `Month ${months}<br><span style="color: #9ca3af; font-size: 12px;">Long-term rental at monthly rate</span>`;
    };

    // Generate clean HTML that exactly matches the dashboard
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.name} - Project Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #e5e7eb;
      background: #0f172a;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      margin-bottom: 30px;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 4px;
    }
    
    .subtitle {
      color: #94a3b8;
      font-size: 14px;
    }
    
    /* Summary Cards */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
    }
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    
    .card-label {
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
    }
    
    .card-value {
      font-size: 22px;
      font-weight: 700;
      color: #f1f5f9;
    }
    
    .card-subtext {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 2px;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #475569;
      border-radius: 4px;
      margin-top: 8px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 4px;
    }
    
    /* Sections */
    .section {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      margin-bottom: 24px;
      padding: 24px;
    }
    
    .section-header {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #f1f5f9;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th {
      text-align: left;
      padding: 12px 16px;
      font-weight: 500;
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #0f172a;
      border-bottom: 1px solid #334155;
    }
    
    td {
      padding: 12px 16px;
      font-size: 14px;
      border-bottom: 1px solid #1e293b;
    }
    
    tr:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    
    .phase-header {
      background: #0f172a;
      font-weight: 700;
      border-left: 4px solid #3b82f6;
    }
    
    .phase-summary {
      background: #0f172a;
      font-weight: 600;
      border-top: 2px solid #334155;
      font-style: italic;
    }
    
    .subphase-name {
      padding-left: 48px !important;
    }
    
    /* Equipment Section */
    .equipment-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .pie-chart-container {
      position: relative;
      width: 100%;
      height: 300px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    /* Status badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
    
    .badge-orange {
      background: rgba(251, 146, 60, 0.2);
      color: #fb923c;
    }
    
    .badge-red {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
    
    /* Text colors */
    .text-green { color: #10b981; }
    .text-red { color: #ef4444; }
    .text-orange { color: #f59e0b; }
    .text-blue { color: #3b82f6; }
    .text-gray { color: #94a3b8; }
    
    @media print {
      body {
        background: white;
        color: black;
        padding: 0;
      }
      
      .card, .section {
        background: white;
        border-color: #e5e7eb;
        break-inside: avoid;
      }
      
      .card-label, .text-gray, th {
        color: #6b7280 !important;
      }
      
      .card-value, .section-header, h1 {
        color: black !important;
      }
      
      table {
        font-size: 12px;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${project.name}</h1>
      <div class="subtitle">Project Status Report - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
    </div>
    
    <!-- Summary Cards -->
    <div class="cards-grid">
      <div class="card">
        <div class="card-header">
          <div class="card-label">Budget Hours</div>
        </div>
        <div class="card-value">${totalBudgetHours.toFixed(1)}</div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-label">Hours Spent</div>
        </div>
        <div class="card-value">${totalActualHours.toFixed(1)}</div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-label">Progress</div>
        </div>
        <div class="card-value">${percentComplete.toFixed(1)}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(percentComplete, 100)}%"></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-label">Projection</div>
        </div>
        <div class="card-value">${totalActualHours.toFixed(0)} / ${projectedTotalHours.toFixed(0)}</div>
        <div class="card-subtext">hours spent of projected total</div>
        ${projectedTotalHours !== totalBudgetHours ? `
          <div class="card-subtext ${projectedTotalHours > totalBudgetHours ? 'text-red' : 'text-green'}">
            Budget: ${totalBudgetHours.toFixed(0)} hrs (projected: ${projectedTotalHours.toFixed(0)} hrs)
          </div>
        ` : ''}
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-label">Active Equipment</div>
        </div>
        <div class="card-value">${activeEquipment.length}</div>
        <div class="card-subtext">rentals active</div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <div class="card-label">Equipment Spent</div>
        </div>
        <div class="card-value">$${totalEquipmentSpent.toLocaleString()}</div>
        <div class="card-subtext">total to date</div>
      </div>
    </div>
    
    <!-- Phases & Production Analysis -->
    <div class="section">
      <h2 class="section-header">PHASES & PRODUCTION ANALYSIS</h2>
      <table>
        <thead>
          <tr>
            <th>Phase / Subphase</th>
            <th>Budget Hours</th>
            <th>Budget Quantity</th>
            <th>Hours to Date</th>
            <th>Quantity Complete</th>
            <th>Production Rate</th>
            <th>Projected Total</th>
          </tr>
        </thead>
        <tbody>
          ${project.phases.map((phase, phaseIndex) => {
            // Calculate phase totals
            const phaseTotalBudget = phase.subPhases.reduce((sum: number, sp: any) => sum + sp.budgetHours, 0);
            const phaseHoursToDate = phase.subPhases.reduce((sum: number, sp: any) => {
              const dailyHours = project.dailyReports.reduce((reportSum: number, report: any) => 
                reportSum + report.progress
                  .filter((p: any) => p.subPhaseId === sp.id)
                  .reduce((pSum: number, p: any) => pSum + p.hoursWorked, 0), 0
              );
              return sum + sp.initialHours + dailyHours;
            }, 0);
            const phaseProjectedTotal = phase.subPhases.reduce((sum: number, sp: any) => {
              const dailyHours = project.dailyReports.reduce((reportSum: number, report: any) => 
                reportSum + report.progress
                  .filter((p: any) => p.subPhaseId === sp.id)
                  .reduce((pSum: number, p: any) => pSum + p.hoursWorked, 0), 0
              );
              const dailyQuantity = project.dailyReports.reduce((reportSum: number, report: any) => 
                reportSum + report.progress
                  .filter((p: any) => p.subPhaseId === sp.id)
                  .reduce((pSum: number, p: any) => pSum + (p.quantityComplete || 0), 0), 0
              );
              const totalHours = sp.initialHours + dailyHours;
              const totalQuantity = (sp.initialQuantity || 0) + dailyQuantity;
              let projectedTotal = sp.budgetHours;
              if (sp.budgetQuantity && totalQuantity > 0 && totalHours > 0) {
                const currentRate = totalHours / totalQuantity;
                projectedTotal = currentRate * sp.budgetQuantity;
              }
              return sum + projectedTotal;
            }, 0);
            
            const phaseRows = `
              ${phaseIndex > 0 ? '<tr><td colspan="7" style="height: 16px;"></td></tr>' : ''}
              <tr class="phase-header">
                <td colspan="7">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 16px;">${phase.name}</span>
                    <span style="font-size: 12px; color: #94a3b8;">Phase ${phaseIndex + 1} of ${project.phases.length}</span>
                  </div>
                </td>
              </tr>
              ${phase.subPhases.map((subPhase: any) => {
                const dailyHours = project.dailyReports.reduce((sum: number, report: any) => 
                  sum + report.progress
                    .filter((p: any) => p.subPhaseId === subPhase.id)
                    .reduce((pSum: number, p: any) => pSum + p.hoursWorked, 0), 0
                );
                const dailyQuantity = project.dailyReports.reduce((sum: number, report: any) => 
                  sum + report.progress
                    .filter((p: any) => p.subPhaseId === subPhase.id)
                    .reduce((pSum: number, p: any) => pSum + (p.quantityComplete || 0), 0), 0
                );
                const totalHours = subPhase.initialHours + dailyHours;
                const totalQuantity = (subPhase.initialQuantity || 0) + dailyQuantity;
                let projectedTotal = subPhase.budgetHours;
                let productionRateHtml = '-';
                
                if (subPhase.budgetQuantity && totalQuantity > 0 && totalHours > 0) {
                  const actualRate = totalHours / totalQuantity;
                  const budgetRate = subPhase.budgetHours / subPhase.budgetQuantity;
                  const isBeatingBudget = actualRate < budgetRate;
                  projectedTotal = actualRate * subPhase.budgetQuantity;
                  productionRateHtml = `
                    <div>
                      <span class="${isBeatingBudget ? 'text-green' : 'text-red'}" style="font-weight: 500;">
                        ${actualRate.toFixed(2)} hrs/${subPhase.unit}
                      </span>
                      <div style="font-size: 12px; color: #94a3b8;">
                        (budget: ${budgetRate.toFixed(2)})
                      </div>
                    </div>
                  `;
                }
                
                return `
                  <tr>
                    <td class="subphase-name">${subPhase.name}</td>
                    <td>${subPhase.budgetHours}</td>
                    <td>${subPhase.budgetQuantity ? `${subPhase.budgetQuantity} ${subPhase.unit}` : '-'}</td>
                    <td>${totalHours.toFixed(1)} hrs</td>
                    <td>
                      ${subPhase.budgetQuantity ? `
                        <div>
                          <span>${totalQuantity.toFixed(1)} ${subPhase.unit}</span>
                          <div style="font-size: 12px; color: #94a3b8;">
                            (${((totalQuantity / subPhase.budgetQuantity) * 100).toFixed(1)}%)
                          </div>
                        </div>
                      ` : '-'}
                    </td>
                    <td>${productionRateHtml}</td>
                    <td class="${projectedTotal > subPhase.budgetHours ? 'text-red' : projectedTotal < subPhase.budgetHours ? 'text-green' : ''}" style="font-weight: 500;">
                      <div>
                        <span>${projectedTotal.toFixed(1)} hrs</span>
                        ${projectedTotal > subPhase.budgetHours ? `
                          <div style="font-size: 12px;">
                            ${((projectedTotal / subPhase.budgetHours - 1) * 100).toFixed(0)}% over
                          </div>
                        ` : projectedTotal < subPhase.budgetHours ? `
                          <div style="font-size: 12px;">
                            ${((1 - projectedTotal / subPhase.budgetHours) * 100).toFixed(0)}% under
                          </div>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              <tr class="phase-summary">
                <td>${phase.name} Total</td>
                <td>${phaseTotalBudget.toFixed(0)} hrs</td>
                <td></td>
                <td>${phaseHoursToDate.toFixed(0)} hrs</td>
                <td></td>
                <td></td>
                <td class="${phaseProjectedTotal > phaseTotalBudget ? 'text-red' : phaseProjectedTotal < phaseTotalBudget ? 'text-green' : ''}" style="font-weight: 500;">
                  <div>
                    <span>${phaseProjectedTotal.toFixed(0)} hrs</span>
                    ${phaseProjectedTotal !== phaseTotalBudget ? `
                      <div style="font-size: 12px;">
                        ${phaseProjectedTotal > phaseTotalBudget ? 
                          `${((phaseProjectedTotal / phaseTotalBudget - 1) * 100).toFixed(0)}% over` :
                          `${((1 - phaseProjectedTotal / phaseTotalBudget) * 100).toFixed(0)}% under`
                        }
                      </div>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
            return phaseRows;
          }).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Equipment Budget Analysis -->
    <div class="section">
      <h2 class="section-header">EQUIPMENT BUDGET ANALYSIS</h2>
      <div class="equipment-grid">
        <div>
          <div class="pie-chart-container">
            <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
              ${(() => {
                let cumulativePercentage = 0;
                return pieData.map((item, index) => {
                  const startAngle = cumulativePercentage * 3.6;
                  const endAngle = (cumulativePercentage + parseFloat(item.percentage)) * 3.6;
                  cumulativePercentage += parseFloat(item.percentage);
                  
                  const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  const largeArcFlag = parseFloat(item.percentage) > 50 ? 1 : 0;
                  
                  return `
                    <path d="M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z" 
                          fill="${pieColors[index % pieColors.length]}" 
                          stroke="#1e293b" 
                          stroke-width="2"/>
                  `;
                }).join('');
              })()}
              <circle cx="100" cy="100" r="40" fill="#1e293b"/>
              <text x="100" y="95" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700">
                $${(totalEquipmentSpent/1000).toFixed(0)}k
              </text>
              <text x="100" y="110" text-anchor="middle" fill="#94a3b8" font-size="12">
                Total Spent to Date
              </text>
            </svg>
          </div>
          <div style="margin-top: 20px;">
            ${pieData.map((item, index) => `
              <div class="legend-item">
                <div class="legend-dot" style="background: ${pieColors[index % pieColors.length]}"></div>
                <div style="flex: 1;">
                  <div style="font-weight: 500;">${item.name}</div>
                  <div style="font-size: 12px; color: #94a3b8;">$${item.value.toFixed(0)} (${item.percentage}%)</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div>
          <table>
            <thead>
              <tr>
                <th>Equipment Type</th>
                <th>Budget</th>
                <th>Spent to Date</th>
                <th>Variance</th>
                <th>% Complete</th>
                <th>Projected Total</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(equipmentByType)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([type, data]) => {
                  const variance = data.spent - data.budget;
                  const percentComplete = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
                  const projectedTotal = data.active > 0 ? data.spent * 1.2 : data.spent;
                  
                  return `
                    <tr>
                      <td>
                        <div>
                          <div style="font-weight: 500;">${type}</div>
                          <div style="font-size: 12px; color: #94a3b8;">
                            ${data.active} active, ${data.returned} returned
                          </div>
                        </div>
                      </td>
                      <td>$${data.budget.toLocaleString()}</td>
                      <td>$${data.spent.toFixed(0)}</td>
                      <td class="${variance > 0 ? 'text-red' : variance < 0 ? 'text-green' : ''}" style="font-weight: 500;">
                        ${variance > 0 ? '+' : ''}$${variance.toFixed(0)}
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="width: 96px; height: 8px; background: #475569; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${Math.min(percentComplete, 100)}%; height: 100%; background: ${percentComplete > 100 ? '#ef4444' : percentComplete > 80 ? '#f59e0b' : '#10b981'}; border-radius: 4px;"></div>
                          </div>
                          <span>${percentComplete.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td class="${projectedTotal > data.budget ? 'text-red' : 'text-green'}" style="font-weight: 500;">
                        $${projectedTotal.toFixed(0)}
                        ${projectedTotal > data.budget ? `
                          <div style="font-size: 12px;">
                            ${((projectedTotal / data.budget - 1) * 100).toFixed(0)}% over
                          </div>
                        ` : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
              <tr style="font-weight: 600; background: rgba(255,255,255,0.02);">
                <td>Total</td>
                <td>$${Object.values(equipmentBudgets).reduce((sum, budget) => sum + budget, 0).toLocaleString()}</td>
                <td>$${totalEquipmentSpent.toFixed(0)}</td>
                <td class="${totalEquipmentSpent > Object.values(equipmentBudgets).reduce((sum, budget) => sum + budget, 0) ? 'text-red' : 'text-green'}" style="font-weight: 500;">
                  $${(totalEquipmentSpent - Object.values(equipmentBudgets).reduce((sum, budget) => sum + budget, 0)).toFixed(0)}
                </td>
                <td>
                  ${((totalEquipmentSpent / Object.values(equipmentBudgets).reduce((sum, budget) => sum + budget, 0)) * 100).toFixed(0)}%
                </td>
                <td>
                  $${(totalEquipmentSpent * 1.2).toFixed(0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Equipment Rental Optimization Tracker -->
    <div class="section">
      <h2 class="section-header">EQUIPMENT RENTAL OPTIMIZATION TRACKER</h2>
      <table>
        <thead>
          <tr>
            <th>Equipment</th>
            <th>Start Date</th>
            <th>Current Status</th>
            <th>Weekly Return</th>
            <th>Monthly Return</th>
            <th>Total Spent<br><span style="font-weight: 400; font-size: 11px;">to Date</span></th>
            <th>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          ${activeEquipment.map((eq: any) => {
            const daysRented = calculateDaysRented(eq.startDate);
            const currentWeek = Math.ceil(daysRented / 7);
            const currentStatus = daysRented <= 7 ? `Week ${currentWeek} active` : 
                                 daysRented <= 28 ? `Week ${currentWeek} active` : 
                                 `Month ${Math.floor(daysRented / 28)}`;
            
            // Calculate return dates
            const startDate = new Date(eq.startDate);
            const weeklyReturn = new Date(startDate);
            weeklyReturn.setDate(weeklyReturn.getDate() + (7 - (daysRented % 7)) % 7);
            const monthlyReturn = new Date(startDate);
            monthlyReturn.setDate(monthlyReturn.getDate() + (28 - (daysRented % 28)) % 28);
            
            return `
              <tr>
                <td>
                  <div style="font-weight: 500;">${eq.name || 'Unknown Equipment'}</div>
                  ${eq.supplier ? `<div style="font-size: 12px; color: #94a3b8;">${eq.supplier}</div>` : ''}
                </td>
                <td>${new Date(eq.startDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}</td>
                <td>
                  <div style="font-weight: 500;">${currentStatus}</div>
                  <div style="font-size: 12px; color: #94a3b8;">$${eq.rate}/day</div>
                </td>
                <td>
                  <div>${weeklyReturn.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', weekday: 'short' })}</div>
                  <div style="font-size: 12px; color: #94a3b8;">Week ${currentWeek} - $${eq.weeklyRate || eq.rate * 5}/wk</div>
                </td>
                <td>
                  <div>${monthlyReturn.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', weekday: 'short' })}</div>
                  <div style="font-size: 12px; color: #94a3b8;">28 days - $${eq.monthlyRate || eq.rate * 20}/mo</div>
                </td>
                <td style="font-weight: 500;">$${calculateTotalCost(eq).toFixed(0)}</td>
                <td>${getRecommendation(eq)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}