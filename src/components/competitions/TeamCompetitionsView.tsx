"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  Medal,
  Crown,
  Target,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TeamCompetitionsViewProps {
  competitions: any[];
  pastCompetitions: any[];
  userTeams: any[];
  isWorker: boolean;
}

export default function TeamCompetitionsView({
  competitions,
  pastCompetitions,
  userTeams,
  isWorker,
}: TeamCompetitionsViewProps) {
  const router = useRouter();
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(
    competitions[0]?.id || null
  );

  const activeCompetition = competitions.find(c => c.id === selectedCompetition);
  const userTeamIds = userTeams.map(t => t.id);

  const getMetricDisplay = (metric: string) => {
    switch (metric) {
      case "total_points":
        return { label: "Total Points", icon: Trophy };
      case "total_tasks":
        return { label: "Total Tasks", icon: Target };
      case "avg_productivity":
        return { label: "Avg Productivity", icon: TrendingUp };
      default:
        return { label: metric, icon: Zap };
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="font-bold text-gray-500">#{position}</span>;
    }
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Team Competitions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Compete with other teams and win prizes
        </p>
      </div>

      {competitions.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active competitions right now</p>
            <p className="text-sm text-gray-400 mt-2">Check back soon for new competitions!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Competition Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {competitions.map((comp) => (
              <Button
                key={comp.id}
                variant={selectedCompetition === comp.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCompetition(comp.id)}
                className="whitespace-nowrap"
              >
                {comp.title}
              </Button>
            ))}
          </div>

          {/* Active Competition Details */}
          {activeCompetition && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Competition Info */}
              <Card className="border-0 shadow-sm lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Competition Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{activeCompetition.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activeCompetition.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Metric</span>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const metric = getMetricDisplay(activeCompetition.metric);
                          const Icon = metric.icon;
                          return (
                            <>
                              <Icon className="h-4 w-4" />
                              <span className="text-sm font-medium">{metric.label}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Prize Pool</span>
                      <Badge variant="success">{activeCompetition.prizePool} points</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Time Remaining</span>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {getDaysRemaining(activeCompetition.endDate)} days
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Teams</span>
                      <span className="text-sm font-medium">
                        {activeCompetition.participants.length} competing
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Prize Distribution</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">1st Place</span>
                        <span className="font-medium">
                          {Math.floor(activeCompetition.prizePool * 0.5)} points
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">2nd Place</span>
                        <span className="font-medium">
                          {Math.floor(activeCompetition.prizePool * 0.3)} points
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">3rd Place</span>
                        <span className="font-medium">
                          {Math.floor(activeCompetition.prizePool * 0.2)} points
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leaderboard */}
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Current Standings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeCompetition.participants.map((participant: any, index: number) => {
                      const isUserTeam = userTeamIds.includes(participant.teamId);
                      return (
                        <div
                          key={participant.id}
                          className={`flex items-center justify-between p-4 rounded-lg ${
                            isUserTeam
                              ? "bg-primary/5 border-2 border-primary/20"
                              : "bg-gray-50 dark:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 text-center">
                              {getRankIcon(index + 1)}
                            </div>
                            <div>
                              <p className="font-semibold flex items-center gap-2">
                                {participant.team.name}
                                {isUserTeam && (
                                  <Badge variant="outline" className="text-xs">
                                    Your Team
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {participant.team.members.length} members
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">
                              {participant.currentScore.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getMetricDisplay(activeCompetition.metric).label.toLowerCase()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Past Competitions */}
      {pastCompetitions.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Competition Winners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastCompetitions.map((comp: any) => (
                <div key={comp.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{comp.title}</h4>
                      <p className="text-sm text-gray-500">
                        Ended {new Date(comp.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{comp.prizePool} points</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {comp.winners.map((winner: any) => (
                      <div
                        key={winner.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        {getRankIcon(winner.position)}
                        <span className="font-medium">Team #{winner.teamId}</span>
                        <span className="text-gray-500">
                          ({winner.prizePoints} pts)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}