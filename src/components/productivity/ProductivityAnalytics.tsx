"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Clock,
  Target,
  Activity,
  ChevronRight,
  Plus
} from "lucide-react";

interface ProductivityAnalyticsProps {
  profile: any;
  productivityData: any[];
  achievementsCount: number;
  averageMetrics: {
    tasksCompleted: number;
    hoursWorked: number;
    points: number;
  };
}

export default function ProductivityAnalytics({
  profile,
  productivityData,
  achievementsCount,
  averageMetrics,
}: ProductivityAnalyticsProps) {
  const [selectedRange, setSelectedRange] = useState<7 | 14 | 30>(7);

  // Calculate metrics for selected range
  const filteredData = productivityData.slice(-selectedRange);
  
  const totalTasks = filteredData.reduce((sum, entry) => sum + entry.tasksCompleted, 0);
  const totalHours = filteredData.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const totalPoints = filteredData.reduce((sum, entry) => sum + entry.points, 0);

  // Calculate daily averages
  const dailyAvgTasks = totalTasks / selectedRange;
  const dailyAvgHours = totalHours / selectedRange;

  // Calculate productivity score (tasks per hour)
  const productivityScore = totalHours > 0 ? (totalTasks / totalHours).toFixed(2) : "0";

  // Find best day
  const bestDay = filteredData.reduce((best, entry) => 
    entry.points > (best?.points || 0) ? entry : best, 
    filteredData[0]
  );

  // Create chart data
  const chartData = filteredData.map(entry => ({
    date: new Date(entry.date).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    }),
    tasks: entry.tasksCompleted,
    hours: entry.hoursWorked,
    points: entry.points,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Productivity Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your performance and identify trends
          </p>
        </div>
        <Link href="/dashboard/productivity/log">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Work
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {profile.currentLevel}</div>
            <p className="text-xs text-muted-foreground">
              {profile.totalPoints} total points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Keep it going!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productivityScore}</div>
            <p className="text-xs text-muted-foreground">
              Tasks per hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievementsCount}</div>
            <p className="text-xs text-muted-foreground">
              Unlocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedRange === 7 ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedRange(7)}
        >
          Last 7 Days
        </Button>
        <Button
          variant={selectedRange === 14 ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedRange(14)}
        >
          Last 14 Days
        </Button>
        <Button
          variant={selectedRange === 30 ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedRange(30)}
        >
          Last 30 Days
        </Button>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Simple text-based chart */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Activity</span>
                <span className="text-muted-foreground">Last {selectedRange} days</span>
              </div>
              <div className="flex gap-1">
                {chartData.map((day, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-primary/10 rounded-sm relative group"
                    style={{
                      height: `${Math.max(20, (day.points / 50) * 100)}px`,
                    }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-sm transition-all"
                      style={{
                        height: `${Math.max(20, (day.points / 50) * 100)}px`,
                      }}
                    />
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.points}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
              <div>
                <p className="text-sm font-medium">Total Tasks</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-xs text-muted-foreground">
                  {dailyAvgTasks.toFixed(1)} per day
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  {dailyAvgHours.toFixed(1)} per day
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Points Earned</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-xs text-muted-foreground">
                  {(totalPoints / selectedRange).toFixed(1)} per day
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {bestDay ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {new Date(bestDay.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold">{bestDay.tasksCompleted}</p>
                    <p className="text-xs text-muted-foreground">tasks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{bestDay.hoursWorked}</p>
                    <p className="text-xs text-muted-foreground">hours</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{bestDay.points}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Tasks per day</span>
                <Badge variant="outline">{averageMetrics.tasksCompleted}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Hours per day</span>
                <Badge variant="outline">{averageMetrics.hoursWorked}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Points per day</span>
                <Badge variant="outline">{averageMetrics.points}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Link href="/dashboard/productivity/history">
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {productivityData.slice(-5).reverse().map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {entry.tasksCompleted} tasks completed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()} • {entry.hoursWorked} hours
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">+{entry.points} pts</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}