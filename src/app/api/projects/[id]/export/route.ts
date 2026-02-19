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
        tasks: {
          orderBy: { createdAt: 'asc' }
        },
        dailyReports: {
          orderBy: { date: 'desc' },
          include: {
            progress: {
              include: {
                task: true,
                subPhase: true
              }
            }
          }
        },
        equipment: {
          orderBy: { startDate: 'desc' }
        }
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Calculate totals
    let totalBudgetHours = 0;
    let totalInitialHours = 0;
    
    if (project.phases && project.phases.length > 0) {
      project.phases.forEach(phase => {
        phase.subPhases.forEach(subPhase => {
          totalBudgetHours += subPhase.budgetHours;
          totalInitialHours += subPhase.initialHours;
        });
      });
    } else {
      totalBudgetHours = project.tasks.reduce((sum, task) => sum + task.budgetHours, 0);
      totalInitialHours = project.tasks.reduce((sum, task) => sum + task.initialHours, 0);
    }
    
    const totalDailyHours = project.dailyReports.reduce((sum, report) => 
      sum + report.progress.reduce((taskSum, progress) => taskSum + progress.hoursWorked, 0), 0
    );
    const totalActualHours = totalInitialHours + totalDailyHours;
    const percentComplete = totalBudgetHours > 0 ? (totalActualHours / totalBudgetHours) * 100 : 0;

    // Calculate equipment totals
    const activeEquipment = project.equipment?.filter((eq: any) => eq.status === "active") || [];
    let totalEquipmentSpent = 0;
    
    project.equipment?.forEach(eq => {
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
      
      totalEquipmentSpent += cost;
    });

    // Generate HTML content with modern dark theme
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
      color: #e5e7eb;
      background: #0f172a;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: #0f172a;
    }
    
    .header {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1e293b;
    }
    
    h1 {
      font-size: 36px;
      color: #f1f5f9;
      margin-bottom: 10px;
    }
    
    h2 {
      font-size: 28px;
      color: #f1f5f9;
      margin: 40px 0 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #1e293b;
    }
    
    .project-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-card {
      background: #1e293b;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #334155;
    }
    
    .info-label {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 5px;
    }
    
    .info-value {
      font-size: 18px;
      font-weight: 600;
      color: #f1f5f9;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    
    .stat-card {
      background: #1e293b;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #334155;
      text-align: center;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin: 10px 0;
    }
    
    .stat-label {
      font-size: 14px;
      color: #94a3b8;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    
    th {
      background: #334155;
      color: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #334155;
      color: #e5e7eb;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .phase-header {
      background: #1e293b;
      font-weight: 600;
    }
    
    .phase-header td {
      color: #f1f5f9;
      font-size: 16px;
    }
    
    .subphase-row td:first-child {
      padding-left: 30px;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .badge-success {
      background: #065f46;
      color: #34d399;
    }
    
    .badge-warning {
      background: #713f12;
      color: #fbbf24;
    }
    
    .badge-danger {
      background: #7f1d1d;
      color: #f87171;
    }
    
    .badge-info {
      background: #1e3a8a;
      color: #60a5fa;
    }
    
    .equipment-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    
    .equipment-card {
      background: #1e293b;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #334155;
    }
    
    .equipment-name {
      font-weight: 600;
      font-size: 18px;
      margin-bottom: 10px;
      color: #f1f5f9;
    }
    
    .equipment-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      font-size: 14px;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #334155;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    
    @media print {
      body {
        background: white;
        color: #1a1a1a;
        padding: 0;
      }
      .container {
        max-width: 100%;
      }
      .stat-card, .info-card, .equipment-card, table {
        background: white;
        border: 1px solid #e5e7eb;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      th {
        background: #f3f4f6 !important;
        color: #1a1a1a !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .header {
        border-bottom-color: #e5e7eb;
      }
      h1, h2, .phase-header td {
        color: #1a1a1a !important;
      }
      td, .info-value, .stat-value {
        color: #1a1a1a !important;
      }
      .info-label, .stat-label {
        color: #6b7280 !important;
      }
      .badge {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${project.name}</h1>
      <p style="color: #94a3b8; font-size: 18px;">Project Performance Report</p>
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
        <div class="stat-label">Budget Hours</div>
        <div class="stat-value">${totalBudgetHours.toFixed(0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Hours Spent</div>
        <div class="stat-value">${totalActualHours.toFixed(0)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Progress</div>
        <div class="stat-value">${percentComplete.toFixed(1)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Equipment Active</div>
        <div class="stat-value">${activeEquipment.length}</div>
      </div>
    </div>
    
    <h2>Phases & Production Analysis</h2>
    <table>
      <thead>
        <tr>
          <th>Phase / Subphase</th>
          <th>Budget Hours</th>
          <th>Hours to Date</th>
          <th>Progress</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${project.phases && project.phases.length > 0 ? project.phases.map(phase => {
          const phaseSubPhases = phase.subPhases;
          const phaseBudgetHours = phaseSubPhases.reduce((sum, sp) => sum + sp.budgetHours, 0);
          const phaseInitialHours = phaseSubPhases.reduce((sum, sp) => sum + sp.initialHours, 0);
          
          const phaseDailyHours = phaseSubPhases.reduce((sum, sp) => {
            const subPhaseDailyHours = project.dailyReports.reduce((reportSum, report) => 
              reportSum + report.progress
                .filter(p => p.subPhaseId === sp.id)
                .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
            );
            return sum + subPhaseDailyHours;
          }, 0);
          
          const phaseTotalHours = phaseInitialHours + phaseDailyHours;
          const phaseProgress = phaseBudgetHours > 0 ? (phaseTotalHours / phaseBudgetHours) * 100 : 0;
          
          return `
            <tr class="phase-header">
              <td><strong>${phase.name}</strong></td>
              <td>${phaseBudgetHours.toFixed(0)}</td>
              <td>${phaseTotalHours.toFixed(0)}</td>
              <td>${phaseProgress.toFixed(1)}%</td>
              <td>Phase ${phase.orderIndex} of ${project.phases.length}</td>
            </tr>
            ${phaseSubPhases.map(subPhase => {
              const dailyHours = project.dailyReports.reduce((sum, report) => 
                sum + report.progress
                  .filter(p => p.subPhaseId === subPhase.id)
                  .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
              );
              const totalHours = subPhase.initialHours + dailyHours;
              const progress = subPhase.budgetHours > 0 ? (totalHours / subPhase.budgetHours) * 100 : 0;
              
              return `
                <tr class="subphase-row">
                  <td>${subPhase.name}</td>
                  <td>${subPhase.budgetHours.toFixed(0)}</td>
                  <td>${totalHours.toFixed(1)}</td>
                  <td>${progress.toFixed(1)}%</td>
                  <td>
                    <span class="badge ${
                      progress >= 100 ? 'badge-success' : 
                      progress > 50 ? 'badge-info' : 
                      progress > 0 ? 'badge-warning' : ''
                    }">
                      ${
                        progress >= 100 ? 'Complete' : 
                        progress > 0 ? 'In Progress' : 
                        'Not Started'
                      }
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          `;
        }).join('') : `
          ${project.tasks.map(task => {
            const dailyHours = project.dailyReports.reduce((sum, report) => 
              sum + report.progress
                .filter(p => p.taskId === task.id)
                .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
            );
            const actualHours = task.initialHours + dailyHours;
            const progress = task.budgetHours > 0 ? (actualHours / task.budgetHours) * 100 : 0;
            
            return `
              <tr>
                <td>${task.name}</td>
                <td>${task.budgetHours}</td>
                <td>${actualHours.toFixed(1)}</td>
                <td>${progress.toFixed(1)}%</td>
                <td>
                  <span class="badge ${
                    progress >= 100 ? 'badge-success' : 
                    progress > 50 ? 'badge-info' : 
                    progress > 0 ? 'badge-warning' : ''
                  }">
                    ${
                      progress >= 100 ? 'Complete' : 
                      progress > 0 ? 'In Progress' : 
                      'Not Started'
                    }
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        `}
      </tbody>
    </table>
    
    <h2>Equipment Budget Analysis</h2>
    <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
      <div class="stat-card">
        <div class="stat-label">Active Rentals</div>
        <div class="stat-value">${activeEquipment.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Spent</div>
        <div class="stat-value">$${totalEquipmentSpent.toLocaleString()}</div>
      </div>
    </div>
    
    <div class="equipment-grid">
      ${activeEquipment.length > 0 ? activeEquipment.slice(0, 6).map(eq => {
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
      }).join('') : '<p style="color: #94a3b8; padding: 20px;">No active equipment rentals</p>'}
    </div>
    
    <div class="footer">
      <p>Generated by Leaderboards Construction Management System</p>
      <p>${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Return HTML for printing
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}