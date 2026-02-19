"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  TrendingUp,
  Calendar,
  Activity,
  Target,
  Award,
  ArrowUpRight,
  Clock,
  Zap
} from "lucide-react";
import Link from "next/link";

interface WorkerDashboardProps {
  profile: any;
}

export default function ModernWorkerDashboard({ profile }: WorkerDashboardProps) {
  const recentProductivity = profile.productivity || [];
  const totalTasksThisWeek = recentProductivity.reduce(
    (sum: number, entry: any) => sum + entry.tasksCompleted,
    0
  );
  const totalHoursThisWeek = recentProductivity.reduce(
    (sum: number, entry: any) => sum + entry.hoursWorked,
    0
  );

  const stats = [
    {
      label: "Total Points",
      value: profile.totalPoints.toLocaleString(),
      change: "+12%",
      icon: Trophy,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Current Streak",
      value: `${profile.currentStreak} days`,
      change: "Active",
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Tasks Completed",
      value: totalTasksThisWeek.toString(),
      change: `${totalHoursThisWeek.toFixed(1)}h worked`,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Current Level",
      value: `Level ${profile.currentLevel}`,
      change: `${100 - (profile.totalPoints % 100)}pts to next`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {profile.user?.name || "Worker"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's your performance overview for this week
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/productivity/log" className="block">
              <Button className="w-full justify-between group" variant="outline">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Log Today's Work
                </span>
                <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </Link>
            
            <Link href="/dashboard/challenges" className="block">
              <Button className="w-full justify-between group" variant="outline">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  View Challenges
                </span>
                <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </Link>
            
            <Link href="/dashboard/rewards" className="block">
              <Button className="w-full justify-between group" variant="outline">
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Browse Rewards
                </span>
                <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <Link href="/dashboard/productivity">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProductivity.slice(0, 5).map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entry.tasksCompleted} tasks completed
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString()} • {entry.hoursWorked}h worked
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">+{entry.points}</p>
                    <p className="text-sm text-gray-500">points</p>
                  </div>
                </div>
              ))}
              {recentProductivity.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No recent activity. Start logging your work to see progress here.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Achievements</CardTitle>
          <Link href="/dashboard/achievements">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {profile.achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.achievements.slice(0, 3).map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{item.achievement.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.achievement.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.achievement.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Earned {new Date(item.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No achievements yet. Keep working to unlock your first!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}