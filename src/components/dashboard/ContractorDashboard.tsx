"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { 
  Users, 
  Briefcase, 
  Building2,
  Plus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface ContractorDashboardProps {
  profile: any;
}

export default function ContractorDashboard({ profile }: ContractorDashboardProps) {
  const totalWorkers = profile.teams.reduce(
    (sum: number, team: any) => sum + team._count.members,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Contractor Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your teams and job postings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.teams.length}</div>
            <p className="text-xs text-muted-foreground">
              Active teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkers}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.jobPostings.length}</div>
            <p className="text-xs text-muted-foreground">
              Open positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {profile.company || "Not set"}
            </div>
            <Badge variant={profile.verified ? "success" : "secondary"}>
              {profile.verified ? "Verified" : "Pending"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Teams</CardTitle>
            <Link href="/dashboard/teams/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Team
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {profile.teams.length > 0 ? (
              <div className="space-y-4">
                {profile.teams.map((team: any) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team._count.members} members
                      </p>
                    </div>
                    <Link href={`/dashboard/teams/${team.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No teams yet. Create your first team to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Job Postings</CardTitle>
            <Link href="/dashboard/jobs/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Post Job
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {profile.jobPostings.length > 0 ? (
              <div className="space-y-4">
                {profile.jobPostings.map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.location}
                      </p>
                    </div>
                    <Link href={`/dashboard/jobs/${job.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No active job postings. Post a job to find workers.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}