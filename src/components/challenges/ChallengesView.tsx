"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
  Target, 
  Trophy,
  Clock,
  Zap,
  CheckCircle2,
  Calendar,
  TrendingUp
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  skillRequired?: string;
  startDate: string;
  endDate: string;
  pointsReward: number;
  targetValue: number;
  metric: string;
  participants: {
    currentValue: number;
    completed: boolean;
    completedAt?: string;
  }[];
}

interface ChallengesViewProps {
  challenges: Challenge[];
  workerId: string;
  workerSkills: string[];
  completedCount: number;
}

export default function ChallengesView({
  challenges,
  workerId,
  workerSkills,
  completedCount,
}: ChallengesViewProps) {
  const router = useRouter();
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null);

  const handleJoinChallenge = async (challengeId: string) => {
    setJoiningChallenge(challengeId);
    try {
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to join challenge");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to join challenge");
    } finally {
      setJoiningChallenge(null);
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case "tasks":
        return "Tasks";
      case "hours":
        return "Hours";
      case "streak":
        return "Day Streak";
      default:
        return metric;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const activeChallenges = challenges.filter(c => 
    c.participants.length > 0 && !c.participants[0].completed
  );

  const availableChallenges = challenges.filter(c => 
    c.participants.length === 0 && 
    (!c.skillRequired || workerSkills.includes(c.skillRequired))
  );

  const completedChallenges = challenges.filter(c => 
    c.participants.length > 0 && c.participants[0].completed
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          Skill Challenges
        </h1>
        <p className="text-muted-foreground">
          Take on challenges to earn bonus points and prove your skills
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChallenges.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableChallenges.length}</div>
            <p className="text-xs text-muted-foreground">Ready to join</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Active Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeChallenges.map((challenge) => {
                const progress = challenge.participants[0];
                const percentage = Math.min(
                  Math.round((progress.currentValue / challenge.targetValue) * 100),
                  100
                );
                const daysLeft = getDaysRemaining(challenge.endDate);

                return (
                  <div key={challenge.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{challenge.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {challenge.description}
                        </p>
                      </div>
                      <Badge variant="default" className="ml-2">
                        +{challenge.pointsReward} pts
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>
                          {progress.currentValue} / {challenge.targetValue} {getMetricLabel(challenge.metric)}
                        </span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {daysLeft} days left
                        </span>
                        {challenge.skillRequired && (
                          <Badge variant="outline" className="text-xs">
                            {challenge.skillRequired}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Challenges */}
      {availableChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {availableChallenges.map((challenge) => {
                const daysLeft = getDaysRemaining(challenge.endDate);

                return (
                  <div
                    key={challenge.id}
                    className="p-4 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{challenge.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {challenge.description}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        +{challenge.pointsReward} pts
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4" />
                        <span>
                          Complete {challenge.targetValue} {getMetricLabel(challenge.metric)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {daysLeft} days
                          </span>
                          {challenge.skillRequired && (
                            <Badge variant="outline" className="text-xs">
                              {challenge.skillRequired}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinChallenge(challenge.id)}
                          disabled={joiningChallenge === challenge.id}
                        >
                          {joiningChallenge === challenge.id ? "Joining..." : "Join"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedChallenges.map((challenge) => {
                const progress = challenge.participants[0];

                return (
                  <div
                    key={challenge.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{challenge.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Completed {new Date(progress.completedAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">+{challenge.pointsReward} pts</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {challenges.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Challenges Available</h3>
            <p className="text-muted-foreground">
              Check back later for new skill challenges!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}