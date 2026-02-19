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

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Fetch project with daily report for specific date
    const project = await prisma.project.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id,
      },
      include: {
        phases: {
          orderBy: {
            orderIndex: 'asc'
          },
          include: {
            subPhases: {
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        },
        dailyReports: {
          where: {
            date: new Date(date)
          },
          include: {
            progress: {
              include: {
                subPhase: {
                  include: {
                    phase: true
                  }
                },
                task: true
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

    if (!project.dailyReports || project.dailyReports.length === 0) {
      return NextResponse.json(
        { error: "No daily report found for this date" },
        { status: 404 }
      );
    }

    const report = project.dailyReports[0];

    // Generate HTML content for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Daily Report - ${project.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #1a1a1a;
    }
    h1 {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
    .info-section {
      margin-bottom: 10px;
    }
    .info-label {
      font-weight: bold;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #3b82f6;
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .phase-header {
      background-color: #e5e7eb;
      font-weight: bold;
    }
    .subphase-row {
      padding-left: 20px;
    }
    .summary-section {
      background-color: #f0f9ff;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .summary-item {
      background-color: white;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
    }
    .summary-label {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 1.5em;
      font-weight: bold;
      color: #1a1a1a;
    }
    .notes-section {
      background-color: #fefce8;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #facc15;
      margin-top: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
    @media print {
      body {
        margin: 0;
        padding: 10px;
      }
      .header-info {
        break-inside: avoid;
      }
      table {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>Daily Progress Report</h1>
  
  <div class="header-info">
    <div>
      <div class="info-section">
        <span class="info-label">Project:</span> ${project.name}
      </div>
      ${project.location ? `
      <div class="info-section">
        <span class="info-label">Location:</span> ${project.location}
      </div>
      ` : ''}
      <div class="info-section">
        <span class="info-label">Project Start Date:</span> ${new Date(project.startDate).toLocaleDateString()}
      </div>
    </div>
    <div>
      <div class="info-section">
        <span class="info-label">Report Date:</span> ${new Date(report.date).toLocaleDateString()}
      </div>
      <div class="info-section">
        <span class="info-label">Generated:</span> ${new Date().toLocaleString()}
      </div>
    </div>
  </div>

  ${(() => {
    // Calculate summary statistics
    const totalHoursToday = report.progress.reduce((sum, p) => sum + p.hoursWorked, 0);
    const totalQuantityToday = report.progress.reduce((sum, p) => sum + (p.quantityComplete || 0), 0);
    const subPhasesWorked = new Set(report.progress.filter(p => p.subPhaseId).map(p => p.subPhaseId)).size;
    const tasksWorked = new Set(report.progress.filter(p => p.taskId).map(p => p.taskId)).size;
    
    return `
  <div class="summary-section">
    <h2>Daily Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Total Hours Worked</div>
        <div class="summary-value">${totalHoursToday.toFixed(1)} hrs</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Activities Worked On</div>
        <div class="summary-value">${subPhasesWorked > 0 ? subPhasesWorked : tasksWorked}</div>
      </div>
    </div>
  </div>
    `;
  })()}

  <h2>Work Progress Details</h2>
  
  ${report.progress.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>Phase / Activity</th>
        <th>Hours Worked</th>
        <th>Quantity Complete</th>
        <th>Unit</th>
      </tr>
    </thead>
    <tbody>
      ${(() => {
        // Group progress by phase
        const progressByPhase = new Map();
        
        report.progress.forEach(p => {
          if (p.subPhase) {
            const phaseId = p.subPhase.phase.id;
            if (!progressByPhase.has(phaseId)) {
              progressByPhase.set(phaseId, {
                phase: p.subPhase.phase,
                subPhases: []
              });
            }
            progressByPhase.get(phaseId).subPhases.push({
              subPhase: p.subPhase,
              progress: p
            });
          }
        });

        let rows = '';
        
        // Render phases and subphases
        progressByPhase.forEach(({ phase, subPhases }) => {
          rows += `
            <tr class="phase-header">
              <td colspan="4">${phase.name}</td>
            </tr>
          `;
          
          subPhases.forEach(({ subPhase, progress }: any) => {
            rows += `
              <tr>
                <td class="subphase-row">${subPhase.name}</td>
                <td>${progress.hoursWorked}</td>
                <td>${progress.quantityComplete || '-'}</td>
                <td>${subPhase.unit || '-'}</td>
              </tr>
            `;
          });
        });

        // Add any legacy task progress
        report.progress.filter(p => p.task).forEach(p => {
          rows += `
            <tr>
              <td>${p.task!.name}</td>
              <td>${p.hoursWorked}</td>
              <td>${p.quantityComplete || '-'}</td>
              <td>${p.task!.unit || '-'}</td>
            </tr>
          `;
        });

        return rows;
      })()}
    </tbody>
  </table>
  ` : '<p>No progress recorded for this date.</p>'}

  ${report.notes ? `
  <div class="notes-section">
    <h3>Notes</h3>
    <p>${report.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by Construction Progress Tracker</p>
    <p>${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  </div>
</body>
</html>
    `;

    // Return HTML with appropriate headers for download
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="daily-report-${project.name.replace(/[^a-z0-9]/gi, '-')}-${date}.html"`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}