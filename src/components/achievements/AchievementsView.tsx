"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
  Trophy, 
  Target,
  Zap,
  Users,
  Lock,
  CheckCircle2
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsRequired: number;
  category: string;
}

interface AchievementsViewProps {
  groupedAchievements: Record<string, Achievement[]>;
  earnedIds: Set<string>;
  totalPoints: number;
}

export default function AchievementsView({
  groupedAchievements,
  earnedIds,
  totalPoints,
}: AchievementsViewProps) {
  const categoryIcons = {
    PRODUCTIVITY: <Zap className="h-5 w-5" />,
    CONSISTENCY: <Target className="h-5 w-5" />,
    SKILL: <Trophy className="h-5 w-5" />,
    TEAMWORK: <Users className="h-5 w-5" />,
  };

  const categoryNames = {
    PRODUCTIVITY: "Productivity",
    CONSISTENCY: "Consistency",
    SKILL: "Skills",
    TEAMWORK: "Teamwork",
  };

  const totalAchievements = Object.values(groupedAchievements).flat().length;
  const earnedCount = earnedIds.size;
  const completionPercentage = Math.round((earnedCount / totalAchievements) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          Achievements
        </h1>
        <p className="text-muted-foreground">
          Unlock achievements by completing tasks and maintaining streaks
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{earnedCount} of {totalAchievements} achievements unlocked</span>
              <span className="font-semibold">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{earnedCount}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements by Category */}
      {Object.entries(groupedAchievements).map(([category, achievements]) => {
        const categoryEarned = achievements.filter(a => earnedIds.has(a.id)).length;
        const categoryProgress = Math.round((categoryEarned / achievements.length) * 100);

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {categoryIcons[category as keyof typeof categoryIcons]}
                  {categoryNames[category as keyof typeof categoryNames]}
                </CardTitle>
                <Badge variant="secondary">
                  {categoryEarned}/{achievements.length}
                </Badge>
              </div>
              <Progress value={categoryProgress} className="h-1 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {achievements.map((achievement) => {
                  const isEarned = earnedIds.has(achievement.id);
                  const canEarn = totalPoints >= achievement.pointsRequired;

                  return (
                    <div
                      key={achievement.id}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        isEarned
                          ? "border-green-500 bg-green-50"
                          : canEarn
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold flex items-center gap-2">
                            {achievement.name}
                            {isEarned && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={isEarned ? "success" : "outline"}>
                              {achievement.pointsRequired} pts
                            </Badge>
                            {!isEarned && !canEarn && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                {achievement.pointsRequired - totalPoints} pts needed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}