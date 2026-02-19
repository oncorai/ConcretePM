"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { 
  Trophy, 
  Medal, 
  Award,
  TrendingUp,
  Calendar,
  Users,
  Crown,
  Flame,
  Target,
  Star
} from "lucide-react";

interface LeaderboardEntry {
  id: string;
  rank: number;
  user: {
    name: string;
  };
  totalPoints: number;
  currentLevel: number;
  currentStreak: number;
  tasksCompleted: number;
  location?: string;
}

interface LeaderboardsViewProps {
  currentWorker: any;
}

export default function LeaderboardsView({ currentWorker }: LeaderboardsViewProps) {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly" | "all-time">("weekly");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeRange]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboards?timeRange=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      
      const data = await response.json();
      setLeaderboard(data.leaderboard);
      setUserRank(data.userRank);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
          <Medal className="h-6 w-6 text-white" />
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
          <Medal className="h-6 w-6 text-white" />
        </div>
      );
    } else {
      return (
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <span className="font-bold text-muted-foreground">{rank}</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Leaderboards</h1>
            <p className="text-muted-foreground">
              Compete with other workers and climb the ranks
            </p>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-wrap gap-2">
        {(["daily", "weekly", "monthly", "all-time"] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={timeRange === range ? "shadow-md" : ""}
          >
            {range.charAt(0).toUpperCase() + range.slice(1).replace("-", " ")}
          </Button>
        ))}
      </div>

      {/* User's Current Rank */}
      {currentWorker && userRank && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
          <CardContent className="relative py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Your Rank</p>
                  <div className="text-4xl font-bold gradient-text">
                    #{userRank}
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold">{currentWorker.user?.name || "You"}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {currentWorker.totalPoints} points
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Level {currentWorker.currentLevel}
                    </span>
                    {currentWorker.currentStreak > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {currentWorker.currentStreak} day streak
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <TrendingUp className="h-12 w-12 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <Card className="relative border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 order-1 lg:order-1">
            <div className="absolute top-2 right-2">
              <Badge className="bg-gray-500 text-white">2nd</Badge>
            </div>
            <CardContent className="pt-6 text-center">
              {getRankDisplay(2)}
              <h3 className="font-semibold mt-3 truncate">{leaderboard[1]?.user.name}</h3>
              <p className="text-2xl font-bold mt-1">{leaderboard[1]?.totalPoints}</p>
              <p className="text-sm text-muted-foreground">points</p>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="relative border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 transform lg:-translate-y-4 order-2 lg:order-2">
            <div className="absolute top-2 right-2">
              <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">1st</Badge>
            </div>
            <CardContent className="pt-6 text-center">
              {getRankDisplay(1)}
              <h3 className="font-bold text-lg mt-3 truncate">{leaderboard[0]?.user.name}</h3>
              <p className="text-3xl font-bold mt-1 gradient-text">{leaderboard[0]?.totalPoints}</p>
              <p className="text-sm text-muted-foreground">points</p>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="relative border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 order-3">
            <div className="absolute top-2 right-2">
              <Badge className="bg-orange-500 text-white">3rd</Badge>
            </div>
            <CardContent className="pt-6 text-center">
              {getRankDisplay(3)}
              <h3 className="font-semibold mt-3 truncate">{leaderboard[2]?.user.name}</h3>
              <p className="text-2xl font-bold mt-1">{leaderboard[2]?.totalPoints}</p>
              <p className="text-sm text-muted-foreground">points</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">
            All Rankings - {timeRange.charAt(0).toUpperCase() + timeRange.slice(1).replace("-", " ")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <span className="text-muted-foreground">Loading rankings...</span>
              </div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                No data available for this time period
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(3).map((entry) => {
                const isCurrentUser = currentWorker?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md ${
                      isCurrentUser 
                        ? "bg-primary/5 border-2 border-primary/20" 
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="w-14 text-center">
                      {getRankDisplay(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">
                          {entry.user.name}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {entry.location && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {entry.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Level {entry.currentLevel}
                        </span>
                        {entry.currentStreak > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {entry.currentStreak}d
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{entry.totalPoints.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Points
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Award className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {leaderboard.length > 0
                ? Math.round(
                    leaderboard.reduce((sum, entry) => sum + entry.totalPoints, 0) /
                      leaderboard.length
                  ).toLocaleString()
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {leaderboard.length} workers
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Points to Beat
            </CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Target className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userRank && userRank > 1 && leaderboard[userRank - 2]
                ? (leaderboard[userRank - 2].totalPoints - (currentWorker?.totalPoints || 0)).toLocaleString()
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              To reach next rank
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Workers
            </CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <Users className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{leaderboard.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This {timeRange.replace("-", " ")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}