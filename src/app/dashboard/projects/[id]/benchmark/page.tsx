"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Trophy,
  Users,
  BarChart3,
  Minus,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface TaskComparison {
  taskName: string;
  unit: string | null;
  budgetHours: number;
  actualHours: number;
  variance: number;
  productivity: number;
  industryAvgVariance: number | null;
  industryAvgProductivity: number | null;
  industryCount: number;
  performanceRank: number | null;
  totalInComparison: number;
}

interface ProjectSummary {
  projectVariance: number;
  industryAvgVariance: number | null;
  betterThanPercent: number | null;
}

export default function BenchmarkPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  const [comparisons, setComparisons] = useState<TaskComparison[]>([]);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);

  useEffect(() => {
    fetchBenchmarks();
  }, [projectId]);

  const fetchBenchmarks = async () => {
    try {
      const response = await fetch(`/api/benchmarks/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch benchmarks");
      const data = await response.json();
      setProjectData(data.project);
      setComparisons(data.comparisons);
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching benchmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading benchmark data...</div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Project not found</div>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/dashboard/projects/${projectId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{projectData.name} - Benchmarks</h1>
        <p className="mt-2 text-muted-foreground">
          Compare your project performance against industry averages
        </p>
      </div>

      {/* Overall Performance Summary */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Project Variance</p>
            </div>
            <p className={`text-2xl font-bold ${
              summary.projectVariance > 0 ? 'text-red-500' : 'text-green-500'
            }`}>
              {summary.projectVariance > 0 ? '+' : ''}{summary.projectVariance}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.projectVariance > 0 ? 'Over budget' : 'Under budget'}
            </p>
          </Card>

          {summary.industryAvgVariance !== null && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Industry Average</p>
              </div>
              <p className={`text-2xl font-bold ${
                summary.industryAvgVariance > 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {summary.industryAvgVariance > 0 ? '+' : ''}{summary.industryAvgVariance}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Average variance across all projects
              </p>
            </Card>
          )}

          {summary.betterThanPercent !== null && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Performance Rank</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                Top {100 - summary.betterThanPercent}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Better than {summary.betterThanPercent}% of projects
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Task-by-Task Comparison */}
      <Card>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Task Performance Comparison</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your performance vs industry averages by task type
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Your Variance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Industry Avg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Difference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Productivity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparisons.map((comparison) => {
                const varianceDiff = comparison.industryAvgVariance !== null 
                  ? comparison.variance - comparison.industryAvgVariance 
                  : null;
                
                return (
                  <tr key={comparison.taskName}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {comparison.taskName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`flex items-center gap-1 ${
                        comparison.variance > 0 ? 'text-red-500' : comparison.variance < 0 ? 'text-green-500' : 'text-muted-foreground'
                      }`}>
                        {comparison.variance > 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : comparison.variance < 0 ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {Math.abs(comparison.variance)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {comparison.industryAvgVariance !== null ? (
                        <span className={comparison.industryAvgVariance > 0 ? 'text-red-500' : 'text-green-500'}>
                          {comparison.industryAvgVariance > 0 ? '+' : ''}{comparison.industryAvgVariance}%
                        </span>
                      ) : (
                        <span className="text-gray-400">No data</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {varianceDiff !== null ? (
                        <div className={`flex items-center gap-1 font-medium ${
                          varianceDiff < 0 ? 'text-green-500' : varianceDiff > 0 ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {varianceDiff < 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : varianceDiff > 0 ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                          {Math.abs(varianceDiff).toFixed(1)}% {varianceDiff < 0 ? 'better' : varianceDiff > 0 ? 'worse' : 'same'}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {comparison.performanceRank && comparison.totalInComparison > 1 ? (
                        <div className="flex items-center gap-1">
                          {comparison.performanceRank === 1 && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className={comparison.performanceRank <= 3 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                            #{comparison.performanceRank} of {comparison.totalInComparison}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {comparison.productivity > 0 && (
                        <div>
                          <span className="block">{comparison.productivity} {comparison.unit}/hr</span>
                          {comparison.industryAvgProductivity && (
                            <span className="text-xs text-gray-500">
                              Industry: {comparison.industryAvgProductivity} {comparison.unit}/hr
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Performance Insights */}
        <div className="p-6 border-t border-border">
          <h3 className="font-medium text-foreground mb-3">Performance Insights</h3>
          <div className="space-y-3">
            {(() => {
              const bestPerforming = comparisons
                .filter(c => c.industryAvgVariance !== null)
                .sort((a, b) => {
                  const aDiff = a.variance - (a.industryAvgVariance || 0);
                  const bDiff = b.variance - (b.industryAvgVariance || 0);
                  return aDiff - bDiff;
                })[0];
              
              const needsImprovement = comparisons
                .filter(c => c.industryAvgVariance !== null && c.variance > (c.industryAvgVariance || 0))
                .sort((a, b) => {
                  const aDiff = a.variance - (a.industryAvgVariance || 0);
                  const bDiff = b.variance - (b.industryAvgVariance || 0);
                  return bDiff - aDiff;
                })[0];

              return (
                <>
                  {bestPerforming && bestPerforming.variance < (bestPerforming.industryAvgVariance || 0) && (
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Best Performing Task</p>
                        <p className="text-sm text-muted-foreground">
                          "{bestPerforming.taskName}" is {Math.abs(bestPerforming.variance - (bestPerforming.industryAvgVariance || 0)).toFixed(1)}% better than industry average
                        </p>
                      </div>
                    </div>
                  )}

                  {needsImprovement && (
                    <div className="flex items-start gap-3">
                      <TrendingDown className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Area for Improvement</p>
                        <p className="text-sm text-muted-foreground">
                          "{needsImprovement.taskName}" is {Math.abs(needsImprovement.variance - (needsImprovement.industryAvgVariance || 0)).toFixed(1)}% above industry average variance
                        </p>
                      </div>
                    </div>
                  )}

                  {comparisons.filter(c => c.performanceRank === 1).length > 0 && (
                    <div className="flex items-start gap-3">
                      <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Industry Leader</p>
                        <p className="text-sm text-muted-foreground">
                          You're #1 in {comparisons.filter(c => c.performanceRank === 1).length} task{comparisons.filter(c => c.performanceRank === 1).length > 1 ? 's' : ''}!
                        </p>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </Card>
    </div>
  );
}