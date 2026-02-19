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

    // Fetch complete project data
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
              orderBy: { orderIndex: 'asc' },
              include: {
                dailyProgress: true,
                changeOrders: {
                  include: {
                    createdBy: true
                  }
                }
              }
            }
          }
        },
        equipment: {
          orderBy: { startDate: 'desc' }
        },
        schedule: {
          include: {
            scheduleItems: {
              orderBy: { startDate: 'asc' }
            }
          }
        },
        changeOrders: {
          include: {
            subPhase: {
              include: {
                phase: true
              }
            },
            createdBy: true
          }
        },
        dailyReports: {
          orderBy: { date: 'desc' },
          take: 10, // Last 10 reports
          include: {
            progress: {
              include: {
                subPhase: {
                  include: {
                    phase: true
                  }
                }
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

    // Calculate project statistics
    const calculateProjectStats = () => {
      let totalBudgetHours = 0;
      let totalActualHours = 0;
      let totalChangeOrderHours = 0;

      project.phases.forEach(phase => {
        phase.subPhases.forEach(subPhase => {
          totalBudgetHours += subPhase.budgetHours;
          
          const actualHours = subPhase.initialHours + 
            subPhase.dailyProgress.reduce((sum, p) => sum + p.hoursWorked, 0);
          totalActualHours += actualHours;
          
          const changeOrderHours = subPhase.changeOrders.reduce((sum, co) => 
            sum + co.additionalHours, 0
          );
          totalChangeOrderHours += changeOrderHours;
        });
      });

      const totalHoursWithCO = totalBudgetHours + totalChangeOrderHours;
      const percentComplete = totalHoursWithCO > 0 ? (totalActualHours / totalHoursWithCO) * 100 : 0;
      const variance = ((totalActualHours - totalHoursWithCO) / totalHoursWithCO) * 100;

      return {
        totalBudgetHours,
        totalActualHours,
        totalChangeOrderHours,
        totalHoursWithCO,
        percentComplete,
        variance
      };
    };

    const stats = calculateProjectStats();

    // Calculate equipment costs
    const calculateEquipmentCosts = () => {
      let activeRentals = 0;
      let totalMonthlySpend = 0;
      let totalSpentToDate = 0;

      project.equipment.forEach(eq => {
        if (eq.status === 'active') {
          activeRentals++;
          const monthlyRate = eq.monthlyRate || (eq.rate * 30);
          totalMonthlySpend += monthlyRate;
        }
        
        // Calculate total spent
        const startDate = new Date(eq.startDate);
        const endDate = eq.endDate ? new Date(eq.endDate) : new Date();
        const daysRented = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let cost = 0;
        if (eq.rentalType === 'daily') {
          cost = daysRented * eq.rate;
        } else if (eq.rentalType === 'weekly') {
          cost = Math.ceil(daysRented / 7) * (eq.weeklyRate || eq.rate);
        } else if (eq.rentalType === 'monthly') {
          cost = Math.ceil(daysRented / 30) * (eq.monthlyRate || eq.rate);
        }
        
        totalSpentToDate += cost;
      });

      return {
        activeRentals,
        totalMonthlySpend,
        totalSpentToDate
      };
    };

    const equipmentStats = calculateEquipmentCosts();

    // Generate HTML content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Report - ${project.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .header {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }
    
    h1 {
      font-size: 36px;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    
    h2 {
      font-size: 28px;
      color: #1a1a1a;
      margin: 30px 0 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    h3 {
      font-size: 20px;
      color: #374151;
      margin: 20px 0 10px;
    }
    
    .project-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .info-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    
    .info-value {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    
    .stat-card {
      background: #f0f9ff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
      text-align: center;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
      margin: 10px 0;
    }
    
    .stat-label {
      font-size: 14px;
      color: #6b7280;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    th {
      background: #3b82f6;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    tr:hover {
      background: #f9fafb;
    }
    
    .phase-header {
      background: #e0e7ff;
      font-weight: 600;
    }
    
    .subphase-row td:first-child {
      padding-left: 30px;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }
    
    .badge-warning {
      background: #fed7aa;
      color: #92400e;
    }
    
    .badge-danger {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .equipment-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    
    .equipment-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .equipment-name {
      font-weight: 600;
      font-size: 18px;
      margin-bottom: 10px;
    }
    
    .equipment-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      font-size: 14px;
    }
    
    .schedule-timeline {
      margin: 20px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .change-order-card {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
      margin: 10px 0;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      .container {
        max-width: 100%;
      }
      .stat-card {
        break-inside: avoid;
      }
      table {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${project.name}</h1>
      <p style="color: #6b7280; font-size: 18px;">Comprehensive Project Report</p>
    </div>
    
    <div class="project-info">
      <div class="info-card">
        <div class="info-label">Location</div>
        <div class="info-value">${project.location || 'Not specified'}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Project Start Date</div>
        <div class="info-value">${new Date(project.startDate).toLocaleDateString()}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Report Generated</div>
        <div class="info-value">${new Date().toLocaleDateString()}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Days Since Start</div>
        <div class="info-value">${Math.floor((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))}</div>
      </div>
    </div>
    
    <h2>Project Overview</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Progress</div>
        <div class="stat-value">${stats.percentComplete.toFixed(1)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Budget Hours</div>
        <div class="stat-value">${stats.totalBudgetHours.toFixed(0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Actual Hours</div>
        <div class="stat-value">${stats.totalActualHours.toFixed(0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Variance</div>
        <div class="stat-value">${stats.variance > 0 ? '+' : ''}${stats.variance.toFixed(1)}%</div>
      </div>
    </div>
    
    <h2>Phase Progress Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Phase / Activity</th>
          <th>Budget Hours</th>
          <th>Actual Hours</th>
          <th>Change Orders</th>
          <th>Total Hours</th>
          <th>Progress</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${project.phases.map(phase => {
          const phaseActualHours = phase.subPhases.reduce((sum, sp) => 
            sum + sp.initialHours + sp.dailyProgress.reduce((s, p) => s + p.hoursWorked, 0), 0
          );
          const phaseBudgetHours = phase.subPhases.reduce((sum, sp) => sum + sp.budgetHours, 0);
          const phaseChangeOrderHours = phase.subPhases.reduce((sum, sp) => 
            sum + sp.changeOrders.reduce((s, co) => s + co.additionalHours, 0), 0
          );
          const phaseTotalHours = phaseBudgetHours + phaseChangeOrderHours;
          const phaseProgress = phaseTotalHours > 0 ? (phaseActualHours / phaseTotalHours) * 100 : 0;
          
          return `
            <tr class="phase-header">
              <td><strong>${phase.name}</strong></td>
              <td>${phaseBudgetHours.toFixed(1)}</td>
              <td>${phaseActualHours.toFixed(1)}</td>
              <td>${phaseChangeOrderHours > 0 ? '+' + phaseChangeOrderHours.toFixed(1) : '-'}</td>
              <td>${phaseTotalHours.toFixed(1)}</td>
              <td>${phaseProgress.toFixed(1)}%</td>
              <td>
                <span class="badge ${phaseProgress >= 100 ? 'badge-success' : phaseProgress > 0 ? 'badge-info' : ''}">
                  ${phaseProgress >= 100 ? 'Complete' : phaseProgress > 0 ? 'In Progress' : 'Not Started'}
                </span>
              </td>
            </tr>
            ${phase.subPhases.map(subPhase => {
              const actualHours = subPhase.initialHours + 
                subPhase.dailyProgress.reduce((sum, p) => sum + p.hoursWorked, 0);
              const changeOrderHours = subPhase.changeOrders.reduce((sum, co) => sum + co.additionalHours, 0);
              const totalHours = subPhase.budgetHours + changeOrderHours;
              const progress = totalHours > 0 ? (actualHours / totalHours) * 100 : 0;
              const variance = ((actualHours - totalHours) / totalHours) * 100;
              
              return `
                <tr class="subphase-row">
                  <td>${subPhase.name}</td>
                  <td>${subPhase.budgetHours.toFixed(1)}</td>
                  <td>${actualHours.toFixed(1)}</td>
                  <td>${changeOrderHours > 0 ? '+' + changeOrderHours.toFixed(1) : '-'}</td>
                  <td>${totalHours.toFixed(1)}</td>
                  <td>${progress.toFixed(1)}%</td>
                  <td>
                    <span class="badge ${
                      progress >= 100 ? 'badge-success' : 
                      variance > 10 ? 'badge-danger' : 
                      variance < -10 ? 'badge-warning' : 
                      'badge-info'
                    }">
                      ${
                        progress >= 100 ? 'Complete' : 
                        variance > 10 ? 'Over Budget' : 
                        variance < -10 ? 'Under Budget' : 
                        'On Track'
                      }
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          `;
        }).join('')}
      </tbody>
    </table>
    
    ${project.changeOrders.length > 0 ? `
    <h2>Change Orders</h2>
    <div>
      ${project.changeOrders.map(co => `
        <div class="change-order-card">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <strong>${co.subPhase.phase.name} - ${co.subPhase.name}</strong>
            <span>${new Date(co.createdAt).toLocaleDateString()}</span>
          </div>
          <div style="color: #92400e;">+${co.additionalHours} hours</div>
          <div style="margin-top: 5px; font-size: 14px;">${co.reason}</div>
          <div style="margin-top: 5px; font-size: 12px; color: #6b7280;">
            Approved by: ${co.createdBy.name || co.createdBy.email}
          </div>
        </div>
      `).join('')}
      <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
        <strong>Total Change Order Hours: </strong>${stats.totalChangeOrderHours.toFixed(1)} hours
      </div>
    </div>
    ` : ''}
    
    <h2>Equipment Rental Summary</h2>
    <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="stat-card">
        <div class="stat-label">Active Rentals</div>
        <div class="stat-value">${equipmentStats.activeRentals}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Spend</div>
        <div class="stat-value">$${equipmentStats.totalMonthlySpend.toFixed(0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Spent</div>
        <div class="stat-value">$${equipmentStats.totalSpentToDate.toFixed(0)}</div>
      </div>
    </div>
    
    ${project.equipment.filter(eq => eq.status === 'active').length > 0 ? `
    <h3>Active Equipment</h3>
    <div class="equipment-grid">
      ${project.equipment.filter(eq => eq.status === 'active').map(eq => {
        const startDate = new Date(eq.startDate);
        const daysRented = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return `
          <div class="equipment-card">
            <div class="equipment-name">${eq.name}</div>
            <div class="equipment-details">
              <div>
                <div class="info-label">Supplier</div>
                <div>${eq.supplier || 'Unknown'}</div>
              </div>
              <div>
                <div class="info-label">Start Date</div>
                <div>${startDate.toLocaleDateString()}</div>
              </div>
              <div>
                <div class="info-label">Daily Rate</div>
                <div>$${eq.rate}</div>
              </div>
              <div>
                <div class="info-label">Days Rented</div>
                <div>${daysRented}</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    ` : '<p style="color: #6b7280;">No active equipment rentals</p>'}
    
    ${project.schedule ? `
    <h2>Project Schedule</h2>
    <div class="schedule-timeline">
      <div style="margin-bottom: 20px;">
        <strong>Schedule Duration: </strong>
        ${(() => {
          const scheduleItems = project.schedule.scheduleItems;
          if (scheduleItems.length > 0) {
            const start = new Date(scheduleItems[0].startDate);
            const end = new Date(scheduleItems[scheduleItems.length - 1].endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return `${days} days (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
          }
          return 'No schedule defined';
        })()}
      </div>
      
      ${project.schedule.scheduleItems.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Activity</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Duration</th>
            <th>Crew Size</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${project.schedule.scheduleItems.map(item => {
            const today = new Date();
            const start = new Date(item.startDate);
            const end = new Date(item.endDate);
            const isActive = today >= start && today <= end;
            const isComplete = today > end;
            const isPending = today < start;
            
            return `
              <tr>
                <td>${item.subPhaseName}</td>
                <td>${start.toLocaleDateString()}</td>
                <td>${end.toLocaleDateString()}</td>
                <td>${item.plannedDays} days</td>
                <td>${item.requiredWorkers} workers</td>
                <td>
                  <span class="badge ${isComplete ? 'badge-success' : isActive ? 'badge-info' : 'badge-warning'}">
                    ${isComplete ? 'Complete' : isActive ? 'In Progress' : 'Pending'}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      ` : '<p style="color: #6b7280;">No schedule items defined</p>'}
    </div>
    ` : ''}
    
    ${project.dailyReports.length > 0 ? `
    <h2>Recent Daily Reports</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Total Hours</th>
          <th>Activities Worked</th>
          <th>Weather</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${project.dailyReports.slice(0, 10).map(report => {
          const totalHours = report.progress.reduce((sum, p) => sum + p.hoursWorked, 0);
          const activities = new Set(report.progress.map(p => 
            p.subPhase ? p.subPhase.name : 'Unknown'
          ));
          
          return `
            <tr>
              <td>${new Date(report.date).toLocaleDateString()}</td>
              <td>${totalHours.toFixed(1)}</td>
              <td>${activities.size}</td>
              <td>${report.weather || '-'}</td>
              <td>${report.notes || '-'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    ` : ''}
    
    <div class="footer">
      <p>Generated by Leaderboards Construction Management System</p>
      <p>${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Return HTML with appropriate headers for download
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="project-report-${project.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  } catch (error) {
    console.error("Project report export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}