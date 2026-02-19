import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, TrendingUp, AlertCircle } from "lucide-react";

export default async function ProjectReportPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      tasks: {
        orderBy: {
          createdAt: 'asc'
        }
      },
      dailyReports: {
        orderBy: {
          date: 'asc'
        },
        include: {
          progress: {
            include: {
              task: true
            }
          }
        }
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Calculate metrics for each task
  const taskMetrics = project.tasks.map(task => {
    const progressEntries = project.dailyReports.flatMap(report => 
      report.progress.filter(p => p.taskId === task.id)
    );
    
    const dailyHours = progressEntries.reduce((sum, p) => sum + p.hoursWorked, 0);
    const dailyQuantity = progressEntries.reduce((sum, p) => sum + (p.quantityComplete || 0), 0);
    const totalHours = task.initialHours + dailyHours;
    const totalQuantity = (task.initialQuantity || 0) + dailyQuantity;
    const hoursVariance = totalHours - task.budgetHours;
    const percentOver = task.budgetHours > 0 ? ((hoursVariance / task.budgetHours) * 100) : 0;
    
    // Calculate productivity rate
    const productivity = totalQuantity > 0 && totalHours > 0 ? (totalQuantity / totalHours) : 0;
    
    return {
      task,
      totalHours,
      totalQuantity,
      hoursVariance,
      percentOver,
      productivity,
      status: totalHours === 0 ? 'Not started' : totalHours >= task.budgetHours ? 'Complete' : 'In progress',
      initialHours: task.initialHours,
      initialQuantity: task.initialQuantity
    };
  });

  // Calculate overall metrics
  const totalBudgetHours = project.tasks.reduce((sum, task) => sum + task.budgetHours, 0);
  const totalActualHours = taskMetrics.reduce((sum, m) => sum + m.totalHours, 0);
  const overallVariance = totalActualHours - totalBudgetHours;
  const overallPercentVariance = totalBudgetHours > 0 ? ((overallVariance / totalBudgetHours) * 100) : 0;

  // Calculate daily productivity trend
  const last7Days = project.dailyReports.slice(-7);
  const avgDailyProductivity = last7Days.length > 0 
    ? last7Days.reduce((sum, report) => {
        const dayHours = report.progress.reduce((s, p) => s + p.hoursWorked, 0);
        const dayQuantity = report.progress.reduce((s, p) => s + (p.quantityComplete || 0), 0);
        return sum + (dayQuantity > 0 && dayHours > 0 ? dayQuantity / dayHours : 0);
      }, 0) / last7Days.length
    : 0;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/dashboard/reports" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Reports
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {project.name} - Progress Report
            </h1>
            <p className="mt-2 text-gray-400">
              Generated {formatDate(new Date())}
            </p>
          </div>
          <Button className="gap-2" disabled>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Task Status Summary */}
      <Card className="mb-8">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Task Status Summary</h2>
        </div>
        <div className="p-6 space-y-6">
          {taskMetrics.map((metric, index) => (
            <div key={metric.task.id} className="border-b border-gray-700 pb-6 last:border-0 last:pb-0">
              <h3 className="font-semibold text-lg mb-3">
                {metric.task.name} ({metric.status}):
              </h3>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">
                  <strong>Scope:</strong> {metric.task.budgetQuantity || 'N/A'} {metric.task.unit} 
                  {metric.totalQuantity > 0 && ` = ${((metric.totalQuantity / (metric.task.budgetQuantity || 1)) * 100).toFixed(1)}% of project`}
                </li>
                <li className="list-disc">
                  <strong>Budget:</strong> {metric.task.budgetHours} hours
                  {metric.status === 'Complete' && ' excavation'}
                </li>
                <li className="list-disc">
                  <strong>Actual:</strong> {metric.totalHours.toFixed(1)} hours 
                  ({metric.percentOver > 0 ? '+' : ''}{metric.percentOver.toFixed(0)}% {metric.percentOver > 0 ? 'over' : 'under'})
                </li>
                {metric.productivity > 0 && (
                  <li className="list-disc">
                    <strong>Productivity:</strong> {metric.productivity.toFixed(2)} {metric.task.unit}/hr
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Key Findings */}
      <Card className="mb-8">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">KEY FINDINGS</h2>
        </div>
        <div className="p-6">
          <ol className="space-y-3">
            {avgDailyProductivity > 0 && (
              <li className="flex items-start gap-3">
                <span className="font-semibold">1.</span>
                <span>
                  <strong>Average Productivity:</strong> {avgDailyProductivity.toFixed(2)} units/hr over the last 7 days
                </span>
              </li>
            )}
            {taskMetrics.filter(m => m.status === 'Complete').length > 0 && (
              <li className="flex items-start gap-3">
                <span className="font-semibold">2.</span>
                <span>
                  <strong>Completed Tasks:</strong> {taskMetrics.filter(m => m.status === 'Complete').length} of {taskMetrics.length} tasks completed
                </span>
              </li>
            )}
            <li className="flex items-start gap-3">
              <span className="font-semibold">3.</span>
              <span>
                <strong>Total excavation projection:</strong> {totalActualHours.toFixed(1)} hours used of {totalBudgetHours} budgeted 
                ({overallPercentVariance > 0 ? '+' : ''}{overallPercentVariance.toFixed(0)}% variance)
              </span>
            </li>
          </ol>
        </div>
      </Card>

      {/* Efficiency Metrics */}
      <Card className="mb-8">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">EFFICIENCY METRICS</h2>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            <li className="list-disc ml-6">
              <strong>{last7Days.length}-day average productivity:</strong> {avgDailyProductivity.toFixed(2)} units/hr
            </li>
            {taskMetrics.filter(m => m.status === 'Complete' && m.productivity > 0).map((metric, index) => (
              <li key={metric.task.id} className="list-disc ml-6">
                <strong>{metric.task.name} productivity:</strong> {metric.productivity.toFixed(2)} {metric.task.unit}/hr
              </li>
            ))}
            <li className="list-disc ml-6">
              <strong>Total hours to date:</strong> {totalActualHours.toFixed(1)} hours
            </li>
            {overallVariance !== 0 && (
              <li className="list-disc ml-6">
                <strong>Budget variance:</strong> {overallVariance > 0 ? '+' : ''}{overallVariance.toFixed(1)} hours 
                ({overallPercentVariance > 0 ? '+' : ''}{overallPercentVariance.toFixed(0)}%)
              </li>
            )}
          </ul>
        </div>
      </Card>

      {/* Recent Daily Reports */}
      <Card>
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">RECENT DAILY ENTRIES</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {project.dailyReports.slice(-5).reverse().map((report) => {
              const dayHours = report.progress.reduce((sum, p) => sum + p.hoursWorked, 0);
              const dayQuantity = report.progress.reduce((sum, p) => sum + (p.quantityComplete || 0), 0);
              
              return (
                <div key={report.id} className="border-b border-gray-700 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{formatDate(report.date)}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {dayHours.toFixed(1)} hours worked
                        {dayQuantity > 0 && `, ${dayQuantity.toFixed(1)} units completed`}
                      </p>
                      {report.notes && (
                        <p className="text-sm text-gray-400 mt-2">
                          Note: {report.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}