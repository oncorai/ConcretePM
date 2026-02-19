import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { ProjectDetailClient } from "./ProjectDetailClient";
import { PhasesSection } from "@/components/phases/PhasesSection";
import { ArrowLeft, BarChart3, TrendingUp } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  
  const project = await prisma.project.findFirst({
    where: {
      id: id,
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
      tasks: {
        orderBy: {
          createdAt: 'asc'
        }
      },
      dailyReports: {
        orderBy: {
          date: 'desc'
        },
        include: {
          progress: {
            include: {
              task: true,
              subPhase: true
            }
          }
        }
      },
      equipment: true,
      materialBudgets: true,
      equipmentBudgets: true,
      subcontractorBudgets: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Calculate totals including initial progress from phases/subphases or fallback to tasks
  let totalBudgetHours = 0;
  let totalInitialHours = 0;
  let totalBudgetQuantity = 0;
  let totalInitialQuantity = 0;
  let projectedTotalHours = 0;
  
  if (project.phases && project.phases.length > 0) {
    // Use new phases/subphases structure - exclude equipment phase
    project.phases
      .filter(phase => phase.name.toLowerCase() !== 'equipment')
      .forEach(phase => {
        phase.subPhases.forEach(subPhase => {
          totalBudgetHours += subPhase.budgetHours;
          totalInitialHours += subPhase.initialHours;
          totalBudgetQuantity += subPhase.budgetQuantity || 0;
          totalInitialQuantity += subPhase.initialQuantity || 0;
        });
      });
  } else {
    // Fallback to legacy tasks
    totalBudgetHours = project.tasks.reduce((sum, task) => sum + task.budgetHours, 0);
    totalInitialHours = project.tasks.reduce((sum, task) => sum + task.initialHours, 0);
  }
  
  const totalDailyHours = project.dailyReports.reduce((sum, report) => 
    sum + report.progress.reduce((taskSum, progress) => taskSum + progress.hoursWorked, 0), 0
  );
  const totalActualHours = totalInitialHours + totalDailyHours;
  const hoursVariance = totalActualHours - totalBudgetHours;
  const percentComplete = totalBudgetHours > 0 ? (totalActualHours / totalBudgetHours) * 100 : 0;
  
  // Calculate total daily quantity and production rate projections
  let totalDailyQuantity = 0;
  if (project.phases && project.phases.length > 0) {
    project.phases
      .filter(phase => phase.name.toLowerCase() !== 'equipment')
      .forEach(phase => {
        phase.subPhases.forEach(subPhase => {
        const subPhaseDailyQuantity = project.dailyReports.reduce((sum, report) => 
          sum + report.progress
            .filter(p => p.subPhaseId === subPhase.id)
            .reduce((pSum, p) => pSum + (p.quantityComplete || 0), 0), 0
        );
        totalDailyQuantity += subPhaseDailyQuantity;
        
        // Calculate projected hours for this subphase
        const subPhaseTotalQuantity = (subPhase.initialQuantity || 0) + subPhaseDailyQuantity;
        const subPhaseTotalHours = subPhase.initialHours + project.dailyReports.reduce((sum, report) => 
          sum + report.progress
            .filter(p => p.subPhaseId === subPhase.id)
            .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
        );
        
        // Only calculate projection if we have both quantity tracking and actual progress
        if (subPhase.budgetQuantity && subPhase.budgetQuantity > 0 && subPhaseTotalQuantity > 0 && subPhaseTotalHours > 0) {
          const actualProductionRate = subPhaseTotalHours / subPhaseTotalQuantity;
          projectedTotalHours += actualProductionRate * subPhase.budgetQuantity;
        } else {
          // No progress yet or no quantity tracking - use budget hours
          projectedTotalHours += subPhase.budgetHours;
        }
      });
    });
  } else {
    projectedTotalHours = totalBudgetHours;
  }
  
  const totalActualQuantity = totalInitialQuantity + totalDailyQuantity;
  const quantityProgress = totalBudgetQuantity > 0 ? (totalActualQuantity / totalBudgetQuantity) * 100 : 0;

  // Prepare progress data for editing
  const progressData = project.dailyReports.flatMap(report => 
    report.progress
      .filter(p => p.subPhaseId && p.subPhase) // Only include progress with subphase data
      .map(p => ({
        id: p.id,
        subPhaseId: p.subPhaseId,
        subPhaseName: p.subPhase?.name || '',
        costCode: p.subPhase?.costCode || '',
        hoursWorked: p.hoursWorked,
        quantityComplete: p.quantityComplete || 0,
        unit: p.subPhase?.unit || '',
        date: report.date.toISOString() // Convert Date object to string
      }))
  );

  return (
    <div className="flex gap-8 -mx-8">
      {/* Main Content */}
      <div className="flex-1 pl-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        
        {/* Client Component for Edit Functionality */}
        <ProjectDetailClient
          project={project}
          totalBudgetHours={totalBudgetHours}
          totalActualHours={totalActualHours}
          percentComplete={percentComplete}
          projectedTotalHours={projectedTotalHours}
        />

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <p className="text-sm font-medium text-gray-400">Progress</p>
          </div>
          <p className="text-2xl font-bold">{percentComplete.toFixed(1)}%</p>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${Math.min(percentComplete, 100)}%` }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <p className="text-sm font-medium text-gray-400">Manpower Projection</p>
          </div>
          <p className="text-2xl font-bold">
            {totalActualHours.toFixed(0)} / {projectedTotalHours.toFixed(0)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            hours spent of projected total
          </p>
          {projectedTotalHours !== totalBudgetHours && (
            <p className={`text-xs mt-1 ${projectedTotalHours > totalBudgetHours ? 'text-red-400' : 'text-green-400'}`}>
              Budget: {totalBudgetHours.toFixed(0)} hrs (projected: {projectedTotalHours.toFixed(0)} hrs)
            </p>
          )}
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full ${projectedTotalHours > totalBudgetHours ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((totalActualHours / projectedTotalHours) * 100, 100)}%` }}
            />
          </div>
        </Card>

        </div>


        {/* Phases & Production Analysis */}
        <PhasesSection projectId={project.id}>
        <div className="overflow-x-auto">
          {project.phases && project.phases.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Cost Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Phase / Subphase
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Budget Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Budget Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Hours to Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Quantity Complete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Production Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Projected Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Projected Budget
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {project.phases
                  .filter(phase => {
                    const phaseName = phase.name.toLowerCase();
                    return phaseName !== 'equipment' && phaseName !== 'material' && phaseName !== 'materials' && phaseName !== 'subcontractor';
                  })
                  .map((phase, filteredIndex) => {
                    const laborPhases = project.phases.filter(p => {
                      const pName = p.name.toLowerCase();
                      return pName !== 'equipment' && pName !== 'material' && pName !== 'materials' && pName !== 'subcontractor';
                    });
                    return (
                  <React.Fragment key={phase.id}>
                    {/* Add spacing between phases */}
                    {filteredIndex > 0 && (
                      <tr>
                        <td colSpan={10} className="h-4"></td>
                      </tr>
                    )}
                    <tr className="bg-gray-800 border-l-4 border-blue-500">
                      <td colSpan={10} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-white">{phase.name}</span>
                          <span className="text-xs text-gray-400">
                            Phase {filteredIndex + 1} of {laborPhases.length}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {phase.subPhases.map((subPhase) => {
                      // Calculate daily hours and quantities for this subphase
                      const dailyHours = project.dailyReports.reduce((sum, report) => 
                        sum + report.progress
                          .filter(p => p.subPhaseId === subPhase.id)
                          .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
                      );
                      const dailyQuantity = project.dailyReports.reduce((sum, report) => 
                        sum + report.progress
                          .filter(p => p.subPhaseId === subPhase.id)
                          .reduce((pSum, p) => pSum + (p.quantityComplete || 0), 0), 0
                      );
                      const totalHours = subPhase.initialHours + dailyHours;
                      const totalQuantity = (subPhase.initialQuantity || 0) + dailyQuantity;
                      // Calculate projection based on current progress
                      let projectedTotal = subPhase.budgetHours; // Default to budget
                      let projectedBudget = subPhase.budget || 0; // Default to budget
                      if (subPhase.budgetQuantity && totalQuantity > 0 && totalHours > 0) {
                        const currentRate = totalHours / totalQuantity;
                        projectedTotal = currentRate * subPhase.budgetQuantity;
                        // Calculate projected budget based on hours ratio
                        if (subPhase.budget && subPhase.budgetHours > 0) {
                          const budgetPerHour = subPhase.budget / subPhase.budgetHours;
                          projectedBudget = projectedTotal * budgetPerHour;
                        }
                      }
                      
                      return (
                        <tr key={subPhase.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {subPhase.costCode || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {subPhase.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-right">
                            {subPhase.budget ? `$${subPhase.budget.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {subPhase.budgetHours}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {subPhase.budgetQuantity ? `${subPhase.budgetQuantity} ${subPhase.unit}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {totalHours.toFixed(1)} hrs
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {subPhase.budgetQuantity ? (
                              <div>
                                <span>{totalQuantity.toFixed(1)} {subPhase.unit}</span>
                                <span className="text-xs text-gray-500 block">
                                  ({((totalQuantity / subPhase.budgetQuantity) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {subPhase.budgetQuantity && totalQuantity > 0 ? (
                              <div>
                                {(() => {
                                  const actualRate = totalHours / totalQuantity;
                                  const budgetRate = subPhase.budgetHours / subPhase.budgetQuantity;
                                  const isBeatingBudget = actualRate < budgetRate;
                                  
                                  return (
                                    <>
                                      <span className={`font-medium ${isBeatingBudget ? 'text-green-500' : 'text-red-500'}`}>
                                        {actualRate.toFixed(2)} hrs/{subPhase.unit}
                                      </span>
                                      <span className="text-xs text-gray-500 block">
                                        (budget: {budgetRate.toFixed(2)})
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            ) : '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            projectedTotal > subPhase.budgetHours ? 'text-red-600' : projectedTotal < subPhase.budgetHours ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            <div>
                              <span>{projectedTotal.toFixed(1)} hrs</span>
                              {projectedTotal > subPhase.budgetHours && (
                                <span className="text-xs block">
                                  {((projectedTotal / subPhase.budgetHours - 1) * 100).toFixed(0)}% over
                                </span>
                              )}
                              {projectedTotal < subPhase.budgetHours && (
                                <span className="text-xs block">
                                  {((1 - projectedTotal / subPhase.budgetHours) * 100).toFixed(0)}% under
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            projectedBudget > (subPhase.budget || 0) ? 'text-red-600' : projectedBudget < (subPhase.budget || 0) ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {subPhase.budget ? (
                              <div>
                                <span>${projectedBudget.toLocaleString()}</span>
                                {projectedBudget > subPhase.budget && (
                                  <span className="text-xs block">
                                    ${((projectedBudget - subPhase.budget)).toLocaleString()} over
                                  </span>
                                )}
                                {projectedBudget < subPhase.budget && (
                                  <span className="text-xs block">
                                    ${((subPhase.budget - projectedBudget)).toLocaleString()} under
                                  </span>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Phase Summary Row */}
                    {(() => {
                      const phaseTotalBudget = phase.subPhases.reduce((sum, sp) => sum + sp.budgetHours, 0);
                      const phaseTotalBudgetAmount = phase.subPhases.reduce((sum, sp) => sum + (sp.budget || 0), 0);
                      const phaseTotalQuantity = phase.subPhases.reduce((sum, sp) => sum + (sp.budgetQuantity || 0), 0);
                      const phaseCompletedQuantity = phase.subPhases.reduce((sum, sp) => {
                        const dailyQuantity = project.dailyReports.reduce((reportSum, report) => 
                          reportSum + report.progress
                            .filter(p => p.subPhaseId === sp.id)
                            .reduce((pSum, p) => pSum + (p.quantityComplete || 0), 0), 0
                        );
                        return sum + (sp.initialQuantity || 0) + dailyQuantity;
                      }, 0);
                      const phaseHoursToDate = phase.subPhases.reduce((sum, sp) => {
                        const dailyHours = project.dailyReports.reduce((reportSum, report) => 
                          reportSum + report.progress
                            .filter(p => p.subPhaseId === sp.id)
                            .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
                        );
                        return sum + sp.initialHours + dailyHours;
                      }, 0);
                      const phaseProjectedTotal = phase.subPhases.reduce((sum, sp) => {
                        const dailyHours = project.dailyReports.reduce((reportSum, report) => 
                          reportSum + report.progress
                            .filter(p => p.subPhaseId === sp.id)
                            .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
                        );
                        const dailyQuantity = project.dailyReports.reduce((reportSum, report) => 
                          reportSum + report.progress
                            .filter(p => p.subPhaseId === sp.id)
                            .reduce((pSum, p) => pSum + (p.quantityComplete || 0), 0), 0
                        );
                        const totalHours = sp.initialHours + dailyHours;
                        const totalQuantity = (sp.initialQuantity || 0) + dailyQuantity;
                        let projectedTotal = sp.budgetHours; // Default to budget
                        if (sp.budgetQuantity && totalQuantity > 0 && totalHours > 0) {
                          const currentRate = totalHours / totalQuantity;
                          projectedTotal = currentRate * sp.budgetQuantity;
                        }
                        return sum + projectedTotal;
                      }, 0);
                      
                      const phaseProjectedBudget = phase.subPhases.reduce((sum, sp) => {
                        const dailyHours = project.dailyReports.reduce((reportSum, report) => 
                          reportSum + report.progress
                            .filter(p => p.subPhaseId === sp.id)
                            .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
                        );
                        const dailyQuantity = project.dailyReports.reduce((reportSum, report) => 
                          reportSum + report.progress
                            .filter(p => p.subPhaseId === sp.id)
                            .reduce((pSum, p) => pSum + (p.quantityComplete || 0), 0), 0
                        );
                        const totalHours = sp.initialHours + dailyHours;
                        const totalQuantity = (sp.initialQuantity || 0) + dailyQuantity;
                        let projectedTotal = sp.budgetHours; // Default to budget
                        let projectedBudget = sp.budget || 0; // Default to budget
                        if (sp.budgetQuantity && totalQuantity > 0 && totalHours > 0) {
                          const currentRate = totalHours / totalQuantity;
                          projectedTotal = currentRate * sp.budgetQuantity;
                          // Calculate projected budget based on hours ratio
                          if (sp.budget && sp.budgetHours > 0) {
                            const budgetPerHour = sp.budget / sp.budgetHours;
                            projectedBudget = projectedTotal * budgetPerHour;
                          }
                        }
                        return sum + projectedBudget;
                      }, 0);
                      
                      return (
                        <tr className="bg-gray-800 font-semibold border-t-2 border-gray-600">
                          <td className="px-6 py-3 text-sm text-gray-300">
                            
                          </td>
                          <td className="px-6 py-3 text-sm text-white italic">
                            {phase.name} Total
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-300 text-right">
                            {phaseTotalBudgetAmount > 0 ? `$${phaseTotalBudgetAmount.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-300">
                            {phaseTotalBudget.toFixed(0)} hrs
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-300">
                            
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-300">
                            {phaseHoursToDate.toFixed(0)} hrs
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-300">
                            
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {phaseTotalQuantity > 0 && phaseCompletedQuantity > 0 ? (
                              (() => {
                                const actualRate = phaseHoursToDate / phaseCompletedQuantity;
                                const budgetRate = phaseTotalBudget / phaseTotalQuantity;
                                const isBeatingBudget = actualRate < budgetRate;
                                
                                return (
                                  <span className={`font-medium ${isBeatingBudget ? 'text-green-400' : 'text-red-400'}`}>
                                    {actualRate.toFixed(2)} hrs/unit avg
                                  </span>
                                );
                              })()
                            ) : <span className="text-gray-300">-</span>}
                          </td>
                          <td className={`px-6 py-3 text-sm ${
                            phaseProjectedTotal > phaseTotalBudget ? 'text-red-400' : phaseProjectedTotal < phaseTotalBudget ? 'text-green-400' : 'text-gray-300'
                          }`}>
                            <div>
                              <span>{phaseProjectedTotal.toFixed(0)} hrs</span>
                              {phaseProjectedTotal !== phaseTotalBudget && (
                                <span className="text-xs block">
                                  {phaseProjectedTotal > phaseTotalBudget ? 
                                    `${((phaseProjectedTotal / phaseTotalBudget - 1) * 100).toFixed(0)}% over` :
                                    `${((1 - phaseProjectedTotal / phaseTotalBudget) * 100).toFixed(0)}% under`
                                  }
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-3 text-sm ${
                            phaseProjectedBudget > phaseTotalBudgetAmount ? 'text-red-400' : phaseProjectedBudget < phaseTotalBudgetAmount ? 'text-green-400' : 'text-gray-300'
                          }`}>
                            <div>
                              <span>${phaseProjectedBudget.toLocaleString()}</span>
                              {phaseProjectedBudget !== phaseTotalBudgetAmount && (
                                <span className="text-xs block">
                                  {phaseProjectedBudget > phaseTotalBudgetAmount ? 
                                    `$${(phaseProjectedBudget - phaseTotalBudgetAmount).toLocaleString()} over` :
                                    `$${(phaseTotalBudgetAmount - phaseProjectedBudget).toLocaleString()} under`
                                  }
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })()}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            // Fallback to legacy tasks table
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Budget Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Hours Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Projected Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {project.tasks.map((task) => {
                  const dailyHours = project.dailyReports.reduce((sum, report) => 
                    sum + report.progress
                      .filter(p => p.taskId === task.id)
                      .reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
                  );
                  const actualHours = task.initialHours + dailyHours;
                  // For legacy tasks without quantity tracking, projected total equals actual hours
                  const projectedTotal = actualHours;
                  
                  return (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {task.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {task.budgetHours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {task.budgetQuantity ? `${task.budgetQuantity} ${task.unit}` : '-'}
                        {task.initialQuantity && task.initialQuantity > 0 && (
                          <span className="text-xs text-gray-400 block">
                            (Started with {task.initialQuantity} {task.unit})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {actualHours.toFixed(1)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        projectedTotal > task.budgetHours ? 'text-red-600' : projectedTotal < task.budgetHours ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {projectedTotal.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </PhasesSection>
      </div>

      {/* Right Sidebar - Recent Activity */}
      <div className="w-64 flex-shrink-0 pr-8 mt-[88px]">
        <div className="sticky top-24">
          <Card className="bg-gray-800/50">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Recent Activity</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {project.dailyReports.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No reports yet
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {project.dailyReports.map((report) => {
                    const totalHours = report.progress.reduce((sum, p) => sum + p.hoursWorked, 0);
                    return (
                      <div key={report.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(report.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {totalHours.toFixed(1)} hours worked
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              {report.progress.length} tasks
                            </p>
                          </div>
                        </div>
                        {report.notes && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            {report.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}