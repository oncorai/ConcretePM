"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Edit2,
  Save,
  X,
  Plus,
  Minus
} from "lucide-react";

interface Phase {
  id: string;
  name: string;
  subPhases: SubPhase[];
}

interface SubPhase {
  id: string;
  name: string;
  budgetHours: number;
  budgetQuantity?: number;
  unit?: string;
}

interface ScheduleItem {
  subPhaseId: string;
  subPhaseName: string;
  phaseName: string;
  contractorDays: number;
  dataProjectedDays: number;
  plannedDays: number;
  startDate: Date;
  endDate: Date;
  budgetHours: number;
  requiredWorkers: number;
  dailyHours: number;
  budgetStatus: 'under' | 'on-target' | 'over';
  variance: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  actualHours?: number;
  percentComplete?: number;
  daysAhead?: number;
  productivityRate?: number;
  confidence?: 'high' | 'medium' | 'low';
}

interface DailyProgress {
  subPhaseId: string;
  date: Date;
  hoursWorked: number;
  workersCount: number;
  quantityComplete?: number;
}

interface ScheduleBuilderProps {
  projectId: string;
  projectName: string;
  phases: Phase[];
  startDate: Date;
}

const HOURS_PER_DAY = 8; // Standard work day
const DAYS_PER_WEEK = 5; // Monday through Friday

// Helper function to add working days (skip weekends)
function addWorkingDays(startDate: Date, days: number): Date {
  const date = new Date(startDate);
  let remainingDays = days;
  
  if (days === 0) return date;
  
  while (remainingDays > 0) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remainingDays--;
    }
  }
  
  return date;
}

// Helper function to calculate working days between dates
function getWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Ensure date is a working day (move to Monday if weekend)
function ensureWorkingDay(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getDay();
  
  if (dayOfWeek === 0) { // Sunday
    result.setDate(result.getDate() + 1);
  } else if (dayOfWeek === 6) { // Saturday
    result.setDate(result.getDate() + 2);
  }
  
  return result;
}

// Get months in date range for timeline display
function getMonthsInRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    months.push(current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
}

export function ScheduleBuilder({ projectId, projectName, phases, startDate }: ScheduleBuilderProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [phaseDurations, setPhaseDurations] = useState<Record<string, number>>({});
  const [phaseCrewSizes, setPhaseCrewSizes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load existing schedule and daily progress
    loadSchedule();
    loadDailyProgress();
  }, [projectId]);

  const loadSchedule = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/schedule`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.scheduleItems.length > 0) {
          // Load existing schedule
          const items = data.scheduleItems.map((item: any) => ({
            ...item,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
          }));
          setSchedule(items);
          setPhaseDurations(data.phaseDurations as Record<string, number>);
          setIsInitialized(true);
        } else {
          // Initialize phase durations and crew sizes with empty values
          const initialDurations: Record<string, number> = {};
          const initialCrewSizes: Record<string, number> = {};
          phases.forEach(phase => {
            initialDurations[phase.id] = 0;
            initialCrewSizes[phase.id] = 6; // Default 6 workers
          });
          setPhaseDurations(initialDurations);
          setPhaseCrewSizes(initialCrewSizes);
        }
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
      // Initialize on error
      const initialDurations: Record<string, number> = {};
      const initialCrewSizes: Record<string, number> = {};
      phases.forEach(phase => {
        initialDurations[phase.id] = 0;
        initialCrewSizes[phase.id] = 6; // Default 6 workers
      });
      setPhaseDurations(initialDurations);
      setPhaseCrewSizes(initialCrewSizes);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyProgress = async () => {
    try {
      // Load daily reports to get actual progress
      const response = await fetch(`/api/projects/${projectId}/daily-reports`);
      if (response.ok) {
        const reports = await response.json();
        const progress: DailyProgress[] = [];
        
        reports.forEach((report: any) => {
          report.progress.forEach((p: any) => {
            if (p.subPhaseId) {
              progress.push({
                subPhaseId: p.subPhaseId,
                date: new Date(report.date),
                hoursWorked: p.hoursWorked,
                workersCount: p.workersCount || 1,
                quantityComplete: p.quantityComplete
              });
            }
          });
        });
        
        setDailyProgress(progress);
        
        // Load historical productivity data from all projects
        const histResponse = await fetch('/api/projects/historical-productivity');
        if (histResponse.ok) {
          const histData = await histResponse.json();
          setHistoricalData(histData);
        }
      }
    } catch (error) {
      console.error("Error loading daily progress:", error);
    }
  };

  const handleBuildSchedule = () => {
    try {
      const items: ScheduleItem[] = [];
      let currentDate = ensureWorkingDay(new Date(startDate));
      
      // Analyze production data for each subphase
      const analyzeProductionData = (subPhase: SubPhase) => {
        const progress = dailyProgress.filter(p => p.subPhaseId === subPhase.id);
        
        if (progress.length === 0) {
          // No data yet - use conservative estimate
          return {
            avgDailyProduction: 0,
            avgWorkers: phaseCrewSizes[phases.find(p => p.subPhases.includes(subPhase))?.id || ''] || 6,
            daysWorked: 0,
            hoursCompleted: 0,
            hasData: false
          };
        }
        
        // Calculate average daily production rate
        const totalHours = progress.reduce((sum, p) => sum + p.hoursWorked, 0);
        const avgWorkers = progress.reduce((sum, p) => sum + (p.workersCount || 1), 0) / progress.length;
        const daysWorked = new Set(progress.map(p => p.date.toDateString())).size;
        const avgDailyProduction = totalHours / daysWorked;
        
        return {
          avgDailyProduction,
          avgWorkers: Math.round(avgWorkers),
          daysWorked,
          hoursCompleted: totalHours,
          hasData: true
        };
      };
      
      phases.forEach((phase, phaseIndex) => {
        const crewSize = phaseCrewSizes[phase.id] || 6;
        
        // Add gap between phases
        if (phaseIndex > 0) {
          currentDate = addWorkingDays(currentDate, 2);
        }
        
        phase.subPhases.forEach((subPhase, subIndex) => {
          const analysis = analyzeProductionData(subPhase);
          const remainingHours = Math.max(0, subPhase.budgetHours - analysis.hoursCompleted);
          
          let projectedDays: number;
          let confidence: 'high' | 'medium' | 'low' = 'low';
          
          if (analysis.hasData && analysis.avgDailyProduction > 0) {
            // We have actual data - use it for projection
            projectedDays = Math.ceil(remainingHours / analysis.avgDailyProduction);
            confidence = analysis.daysWorked >= 3 ? 'high' : 'medium';
          } else {
            // No data - use crew size and assume 70% productivity
            const dailyCapacity = crewSize * HOURS_PER_DAY * 0.7;
            projectedDays = Math.ceil(subPhase.budgetHours / dailyCapacity);
            confidence = 'low';
          }
          
          // Start date with minimal overlap
          let startDate = currentDate;
          if (subIndex > 0) {
            startDate = addWorkingDays(currentDate, -1);
          }
          
          const endDate = addWorkingDays(startDate, projectedDays - 1);
          currentDate = endDate;
          
          // Determine status based on progress
          let budgetStatus: 'under' | 'on-target' | 'over' = 'on-target';
          if (analysis.hasData) {
            const projectedTotal = analysis.hoursCompleted + (analysis.avgDailyProduction * projectedDays);
            const variance = ((projectedTotal - subPhase.budgetHours) / subPhase.budgetHours) * 100;
            
            if (variance > 10) budgetStatus = 'over';
            else if (variance < -10) budgetStatus = 'under';
          }
          
          const item: ScheduleItem = {
            subPhaseId: subPhase.id,
            subPhaseName: subPhase.name,
            phaseName: phase.name,
            contractorDays: 0, // Not using contractor estimates
            dataProjectedDays: projectedDays,
            plannedDays: projectedDays,
            startDate: startDate,
            endDate: endDate,
            budgetHours: subPhase.budgetHours,
            requiredWorkers: analysis.hasData ? analysis.avgWorkers : crewSize,
            dailyHours: analysis.avgDailyProduction || (crewSize * HOURS_PER_DAY * 0.7),
            budgetStatus: budgetStatus,
            variance: 0,
            productivityRate: analysis.hasData ? (analysis.avgDailyProduction / (analysis.avgWorkers * HOURS_PER_DAY)) : 0.7,
            actualHours: analysis.hoursCompleted,
            percentComplete: (analysis.hoursCompleted / subPhase.budgetHours) * 100,
            confidence
          };
          
          items.push(item);
        });
      });

      setSchedule(items);
      setIsInitialized(true);
      
      // Save the schedule
      saveSchedule(items);
    } catch (error) {
      console.error("Error building schedule:", error);
      alert("Failed to build schedule. Please check the console for details.");
    }
  };

  const saveSchedule = async (items: ScheduleItem[]) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseDurations,
          scheduleItems: items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Schedule save error:", errorData);
        throw new Error(errorData.error || "Failed to save schedule");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const calculateWorkforce = (item: ScheduleItem): ScheduleItem => {
    // Add validation
    if (!item || !item.plannedDays || !item.budgetHours) {
      console.error('Invalid item passed to calculateWorkforce:', item);
      return item;
    }
    
    const totalWorkHours = item.plannedDays * HOURS_PER_DAY;
    const requiredWorkers = Math.ceil(item.budgetHours / totalWorkHours);
    const actualTotalHours = requiredWorkers * totalWorkHours;
    
    // Schedule variance is about DAYS, not hours
    // This should match whether we're ahead/behind on calendar time
    let scheduleVariance = 0;
    let budgetStatus: 'under' | 'on-target' | 'over' = 'on-target';

    // Calculate actual progress from daily reports
    const subPhaseProgress = dailyProgress.filter(p => p.subPhaseId === item.subPhaseId);
    if (subPhaseProgress.length > 0) {
      const actualHours = subPhaseProgress.reduce((sum, p) => sum + p.hoursWorked, 0);
      const firstDay = subPhaseProgress.reduce((min, p) => p.date < min ? p.date : min, subPhaseProgress[0].date);
      const lastDay = subPhaseProgress.reduce((max, p) => p.date > max ? p.date : max, subPhaseProgress[0].date);
      const percentComplete = (actualHours / item.budgetHours) * 100;
      
      // Calculate if ahead or behind schedule (CALENDAR TIME)
      const today = new Date();
      const elapsedDays = getWorkingDays(item.startDate, today);
      const plannedProgressByTime = Math.min((elapsedDays / item.plannedDays) * 100, 100);
      const schedulePerformance = percentComplete - plannedProgressByTime;
      const daysAhead = Math.round((schedulePerformance / 100) * item.plannedDays);
      
      // Calculate productivity rate (WORK EFFICIENCY)
      const avgWorkers = subPhaseProgress.reduce((sum, p) => sum + (p.workersCount || 1), 0) / subPhaseProgress.length;
      const actualDaysWorked = getWorkingDays(firstDay, lastDay);
      const productivityRate = actualHours / (avgWorkers * actualDaysWorked * HOURS_PER_DAY);
      
      // Schedule status based on calendar performance, not hour efficiency
      if (schedulePerformance < -10) {
        budgetStatus = 'over'; // Behind schedule
        scheduleVariance = schedulePerformance;
      } else if (schedulePerformance > 10) {
        budgetStatus = 'under'; // Ahead of schedule
        scheduleVariance = schedulePerformance;
      }

      return {
        ...item,
        requiredWorkers,
        dailyHours: requiredWorkers * HOURS_PER_DAY,
        budgetStatus,
        variance: scheduleVariance, // This is schedule variance, not hour variance
        actualStartDate: firstDay,
        actualEndDate: percentComplete >= 100 ? lastDay : undefined,
        actualHours,
        percentComplete,
        daysAhead,
        productivityRate
      };
    }

    return {
      ...item,
      requiredWorkers,
      dailyHours: requiredWorkers * HOURS_PER_DAY,
      budgetStatus,
      variance: 0
    };
  };

  const updateContractorDays = (subPhaseId: string, contractorDays: number) => {
    setSchedule(prev => {
      let currentDate = ensureWorkingDay(new Date(startDate));
      
      return prev.map(item => {
        const newItem = { ...item };
        
        if (item.subPhaseId === subPhaseId) {
          newItem.contractorDays = contractorDays;
          newItem.plannedDays = contractorDays; // No reduction
          newItem.startDate = ensureWorkingDay(new Date(currentDate));
          newItem.endDate = addWorkingDays(newItem.startDate, newItem.plannedDays - 1);
          
          // Recalculate workforce
          const updated = calculateWorkforce(newItem);
          currentDate = addWorkingDays(updated.endDate, 1);
          return updated;
        } else {
          // Update subsequent dates
          newItem.startDate = ensureWorkingDay(new Date(currentDate));
          newItem.endDate = addWorkingDays(newItem.startDate, newItem.plannedDays - 1);
          currentDate = addWorkingDays(newItem.endDate, 1);
          return newItem;
        }
      });
    });
  };

  const getGanttBarStyle = (item: ScheduleItem) => {
    const totalDuration = schedule[schedule.length - 1]?.endDate.getTime() - schedule[0]?.startDate.getTime();
    const itemStart = item.startDate.getTime() - schedule[0]?.startDate.getTime();
    const itemDuration = item.endDate.getTime() - item.startDate.getTime() + 24 * 60 * 60 * 1000; // Add one day for inclusive
    
    const left = (itemStart / totalDuration) * 100;
    const width = (itemDuration / totalDuration) * 100;
    
    let backgroundColor = 'bg-blue-500';
    if (item.budgetStatus === 'over') backgroundColor = 'bg-red-500';
    else if (item.budgetStatus === 'under') backgroundColor = 'bg-green-500';
    
    return {
      left: `${left}%`,
      width: `${width}%`,
      className: backgroundColor
    };
  };

  const totalBudgetHours = schedule.reduce((sum, item) => sum + item.budgetHours, 0);
  const totalPlannedHours = schedule.reduce((sum, item) => sum + item.requiredWorkers * item.plannedDays * HOURS_PER_DAY, 0);
  const overallVariance = ((totalPlannedHours - totalBudgetHours) / totalBudgetHours) * 100;
  const maxWorkers = Math.max(...schedule.map(item => item.requiredWorkers));
  const issueCount = schedule.filter(item => item.budgetStatus !== 'on-target').length;

  const filteredSchedule = showOnlyIssues 
    ? schedule.filter(item => item.budgetStatus !== 'on-target')
    : schedule;

  if (loading) {
    return (
      <Card className="mb-8">
        <div className="p-6">
          <div className="text-center text-muted-foreground">Loading schedule...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Builder
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isInitialized ? "Data-driven project timeline based on actual production rates" : "Set crew sizes to generate schedule projections"}
            </p>
          </div>
          {isInitialized && (
            <div className="flex items-center gap-2">
              {saving && (
                <span className="text-sm text-muted-foreground">Saving...</span>
              )}
              <Button
                variant={showOnlyIssues ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyIssues(!showOnlyIssues)}
              >
                {showOnlyIssues ? "Show All" : "Show Issues Only"}
                {issueCount > 0 && (
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-500">
                    {issueCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsInitialized(false);
                  setSchedule([]);
                }}
              >
                Edit Schedule
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Duration Input Form */}
      {!isInitialized && (
        <div className="p-6">
          <h3 className="font-medium mb-4">Set Crew Sizes by Phase</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your planned crew size for each phase. The system will project completion dates based on your actual daily production data. Activities with more historical data will have more accurate projections.
          </p>
          <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
            {phases.map(phase => {
              const phaseTotalHours = phase.subPhases.reduce((sum, sp) => sum + sp.budgetHours, 0);
              return (
                <div key={phase.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{phase.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {phase.subPhases.length} activities • {phaseTotalHours.toFixed(0)} hours
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Crew size input */}
                      <div className="flex items-center border border-input rounded-md">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const current = phaseCrewSizes[phase.id] || 6;
                            if (current > 1) {
                              setPhaseCrewSizes(prev => ({
                                ...prev,
                                [phase.id]: current - 1
                              }));
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="6"
                          className="w-12 h-8 text-center text-sm bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={phaseCrewSizes[phase.id] || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 6;
                            setPhaseCrewSizes(prev => ({
                              ...prev,
                              [phase.id]: Math.max(1, Math.min(20, value))
                            }));
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const current = phaseCrewSizes[phase.id] || 6;
                            if (current < 20) {
                              setPhaseCrewSizes(prev => ({
                                ...prev,
                                [phase.id]: current + 1
                              }));
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground">crew</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleBuildSchedule}
              size="sm"
            >
              Generate Schedule Projection
            </Button>
          </div>
        </div>
      )}

      {/* Schedule Display */}
      {isInitialized && (
        <>
          {/* Summary Stats */}
          <div className="p-6 grid grid-cols-4 gap-4 border-b border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Duration</p>
          <p className="text-2xl font-bold">
            {schedule.length > 0 ? getWorkingDays(schedule[0].startDate, schedule[schedule.length - 1].endDate) : 0} days
          </p>
          <p className="text-xs text-muted-foreground">
            ({schedule.length > 0 ? Math.ceil(getWorkingDays(schedule[0].startDate, schedule[schedule.length - 1].endDate) / DAYS_PER_WEEK) : 0} weeks)
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Max Crew Size</p>
          <p className="text-2xl font-bold">{maxWorkers} workers</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Budget Status</p>
          <p className={`text-2xl font-bold ${
            overallVariance > 5 ? 'text-red-500' : overallVariance < -5 ? 'text-green-500' : 'text-blue-500'
          }`}>
            {overallVariance > 0 ? '+' : ''}{overallVariance.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Hours</p>
          <p className="text-xl font-bold">
            {totalPlannedHours.toFixed(0)} / {totalBudgetHours.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Simplified Gantt Chart */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Schedule Timeline</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {schedule[0]?.startDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="text-muted-foreground">to</span>
                <span className="font-medium">
                  {schedule[schedule.length - 1]?.endDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Gantt Chart with progress tracking */}
          <div className="relative bg-muted/20 rounded-lg border border-border p-4 overflow-x-auto" style={{ maxHeight: '400px' }}>
            <div className="min-w-[800px]">
              {/* Month headers */}
              <div className="flex border-b border-border pb-2 mb-4">
                <div className="w-48 flex-shrink-0 text-xs font-medium text-muted-foreground">Activity</div>
                <div className="flex-1 relative">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {schedule.length > 0 && getMonthsInRange(schedule[0].startDate, schedule[schedule.length - 1].endDate).map((month, index) => (
                      <span key={index}>{month}</span>
                    ))}
                  </div>
                  {/* Today line */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{
                      left: `${((new Date().getTime() - schedule[0]?.startDate.getTime()) / 
                              (schedule[schedule.length - 1]?.endDate.getTime() - schedule[0]?.startDate.getTime())) * 100}%`
                    }}
                  >
                    <span className="absolute -top-6 -left-8 text-xs text-red-500 font-medium">Today</span>
                  </div>
                </div>
              </div>
              
              {/* Activity bars */}
              <div className="space-y-3">
                {filteredSchedule.map((item) => {
                  const barStyle = getGanttBarStyle(item);
                  const progressWidth = item.percentComplete ? `${Math.min(item.percentComplete, 100)}%` : '0%';
                  
                  return (
                    <div key={item.subPhaseId} className="flex items-center">
                      <div className="w-48 flex-shrink-0 pr-4">
                        <div className="text-sm font-medium truncate">{item.subPhaseName}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.phaseName} • {item.percentComplete ? `${item.percentComplete.toFixed(0)}%` : 'Not started'}
                        </div>
                      </div>
                      <div className="flex-1 relative h-10">
                        {/* Projected duration with confidence indicator */}
                        <div 
                          className={`absolute h-8 top-1 rounded ${
                            item.confidence === 'high' ? 'bg-blue-600' :
                            item.confidence === 'medium' ? 'bg-blue-500' :
                            'bg-blue-400'
                          } opacity-60`}
                          style={{ 
                            left: barStyle.left, 
                            width: barStyle.width 
                          }}
                        />
                        
                        {/* Actual progress */}
                        {item.percentComplete && item.percentComplete > 0 && (
                          <div 
                            className="absolute h-8 top-1 rounded bg-green-500 opacity-90 flex items-center px-2"
                            style={{ 
                              left: barStyle.left, 
                              width: `${parseFloat(barStyle.width) * item.percentComplete / 100}%`
                            }}
                          >
                            <span className="text-xs text-white font-medium">
                              {item.actualHours?.toFixed(0)}h
                            </span>
                          </div>
                        )}
                        
                        {/* Confidence indicator */}
                        <div className={`absolute left-0 top-0 text-xs font-medium px-1 rounded-tl rounded-br ${
                          item.confidence === 'high' ? 'bg-blue-700 text-white' :
                          item.confidence === 'medium' ? 'bg-blue-600 text-white' :
                          'bg-blue-500 text-white'
                        }`} style={{ left: barStyle.left }}>
                          {item.confidence?.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Days remaining */}
                        {item.dataProjectedDays > 0 && (
                          <div className="absolute right-0 top-1 text-xs font-medium px-1 rounded bg-gray-700 text-white">
                            {item.dataProjectedDays}d remaining
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 bg-blue-500 opacity-60 rounded"></div>
                  <span>Projected Duration</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 bg-green-500 opacity-90 rounded"></div>
                  <span>Completed Work</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Confidence:</span>
                  <Badge variant="default" className="h-5">High</Badge>
                  <Badge variant="secondary" className="h-5">Medium</Badge>
                  <Badge variant="outline" className="h-5">Low</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Phase / Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Days Remaining
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Daily Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Crew Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Daily Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Schedule Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Work Efficiency
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSchedule.map((item, index) => (
                <tr key={item.subPhaseId} className={item.budgetStatus !== 'on-target' ? 'bg-yellow-500/5' : ''}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{item.subPhaseName}</p>
                      <p className="text-xs text-muted-foreground">{item.phaseName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{item.dataProjectedDays}</span>
                      {item.percentComplete && item.percentComplete > 0 && (
                        <span className="text-xs text-muted-foreground block">
                          {item.percentComplete.toFixed(0)}% done
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{item.dailyHours.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground"> hrs/day</span>
                      {item.productivityRate && (
                        <span className="text-xs text-muted-foreground block">
                          {(item.productivityRate * 100).toFixed(0)}% efficiency
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      item.confidence === 'high' ? 'default' : 
                      item.confidence === 'medium' ? 'secondary' : 
                      'outline'
                    }>
                      {item.confidence || 'low'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {item.startDate.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {item.endDate.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.requiredWorkers}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.dailyHours} hrs
                  </td>
                  <td className="px-4 py-3">
                    {item.budgetStatus === 'on-target' && (
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        On Schedule
                      </Badge>
                    )}
                    {item.budgetStatus === 'over' && (
                      <div>
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                          <Clock className="h-3 w-3 mr-1" />
                          Behind Schedule
                        </Badge>
                        {item.variance !== 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            {Math.abs(item.variance).toFixed(0)}% behind
                          </p>
                        )}
                      </div>
                    )}
                    {item.budgetStatus === 'under' && (
                      <div>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Ahead of Schedule
                        </Badge>
                        {item.variance !== 0 && (
                          <p className="text-xs text-green-500 mt-1">
                            {item.variance.toFixed(0)}% ahead
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.productivityRate ? (
                      <div>
                        <div className={`font-medium ${
                          item.productivityRate > 0.9 ? 'text-green-500' : 
                          item.productivityRate < 0.7 ? 'text-red-500' : 
                          'text-yellow-500'
                        }`}>
                          {(item.productivityRate * 100).toFixed(0)}%
                        </div>
                        {item.percentComplete && item.percentComplete > 20 && (
                          <p className="text-xs text-muted-foreground">
                            Learning rate
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Budget Analysis Summary */}
        {issueCount > 0 && (
          <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-600 dark:text-yellow-400">
                  Schedule Budget Analysis
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {issueCount} activities require attention. The current schedule
                  {overallVariance > 0 
                    ? ` will require ${totalPlannedHours.toFixed(0)} total hours, which is ${overallVariance.toFixed(1)}% over the ${totalBudgetHours.toFixed(0)} hour budget.`
                    : ` can be completed within the ${totalBudgetHours.toFixed(0)} hour budget with ${Math.abs(overallVariance).toFixed(1)}% efficiency gain.`
                  }
                </p>
                {overallVariance > 10 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                    Consider extending the schedule or adding more workers to critical phases to stay within budget.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </Card>
  );
}