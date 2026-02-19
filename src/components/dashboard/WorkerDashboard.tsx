"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Zap,
  ArrowUp,
  Star,
  Activity
} from "lucide-react";
import Link from "next/link";

interface WorkerDashboardProps {
  profile: any;
}

export default function WorkerDashboard({ profile }: WorkerDashboardProps) {
  const recentProductivity = profile.productivity || [];
  const totalTasksThisWeek = recentProductivity.reduce(
    (sum: number, entry: any) => sum + entry.tasksCompleted,
    0
  );
  const totalHoursThisWeek = recentProductivity.reduce(
    (sum: number, entry: any) => sum + entry.hoursWorked,
    0
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-lg opacity-90">
            You're currently Level {profile.currentLevel} with {profile.totalPoints} points
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Trophy className="h-64 w-64" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Points</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile.totalPoints.toLocaleString()}</div>
            <div className="flex items-center mt-2 text-sm">
              <div className="flex items-center text-success">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>Level {profile.currentLevel}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Zap className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile.currentStreak}</div>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <span>Consecutive days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Tasks</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTasksThisWeek}</div>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 mr-1" />
              <span>{totalHoursThisWeek.toFixed(1)} hours</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-info/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Achievements</CardTitle>
            <div className="p-2 bg-info/10 rounded-lg">
              <Star className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile.achievements.length}</div>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <span>Badges earned</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Achievements */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Recent Achievements</CardTitle>
              <Link href="/dashboard/achievements">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {profile.achievements.length > 0 ? (
              <div className="space-y-4">
                {profile.achievements.slice(0, 3).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl">
                      {item.achievement.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.achievement.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.achievement.description}
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0">
                      +{item.achievement.pointsRequired}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Star className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No achievements yet. Start logging your work to earn your first badge!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/productivity/log" className="block">
              <Button className="w-full justify-start h-auto p-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all" variant="default">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Log Today's Work</p>
                    <p className="text-sm opacity-90">Track your productivity and earn points</p>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link href="/dashboard/challenges" className="block">
              <Button className="w-full justify-start h-auto p-4 hover:shadow-md transition-all" variant="outline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">View Challenges</p>
                    <p className="text-sm text-muted-foreground">Complete challenges for bonus points</p>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link href="/dashboard/rewards" className="block">
              <Button className="w-full justify-start h-auto p-4 hover:shadow-md transition-all" variant="outline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Trophy className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Browse Rewards</p>
                    <p className="text-sm text-muted-foreground">Redeem your points for prizes</p>
                  </div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}