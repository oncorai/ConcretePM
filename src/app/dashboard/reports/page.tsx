import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { FileText, Calendar, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const projects = await prisma.project.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      tasks: true,
      dailyReports: {
        orderBy: {
          date: 'desc'
        },
        take: 30,
        include: {
          progress: {
            include: {
              task: true
            }
          }
        }
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Reports</h1>
        <p className="mt-2 text-gray-400">
          View and export project progress reports
        </p>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No projects yet
          </h3>
          <p className="text-gray-400 mb-6">
            Create a project and add daily reports to generate reports
          </p>
          <Link href="/dashboard/projects/new">
            <Button>Create Project</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const hasReports = project.dailyReports.length > 0;
            return (
              <Card key={project.id} className="overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {project.name}
                      </h2>
                      {project.location && (
                        <p className="text-sm text-gray-400 mt-1">
                          {project.location}
                        </p>
                      )}
                    </div>
                    {hasReports && (
                      <Link href={`/dashboard/reports/${project.id}`}>
                        <Button size="sm" className="gap-2">
                          <FileText className="h-4 w-4" />
                          View Report
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {hasReports ? (
                  <div className="p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                          <Calendar className="h-4 w-4" />
                          Latest Report
                        </div>
                        <p className="font-medium">
                          {new Date(project.dailyReports[0].date).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          Total Progress
                        </div>
                        <p className="font-medium">
                          {project.dailyReports.length} daily reports
                        </p>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400 mb-1">
                          Total Hours
                        </div>
                        <p className="font-medium">
                          {(
                            project.tasks.reduce((sum, task) => sum + task.initialHours, 0) +
                            project.dailyReports.reduce((sum, report) => 
                              sum + report.progress.reduce((pSum, p) => pSum + p.hoursWorked, 0), 0
                            )
                          ).toFixed(1)} hours
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    No daily reports yet for this project
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}