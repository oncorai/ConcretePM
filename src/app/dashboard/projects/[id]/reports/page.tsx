import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Calendar, Download, FileText } from "lucide-react";

export default async function AllReportsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      dailyReports: {
        orderBy: {
          date: 'desc'
        },
        include: {
          progress: {
            include: {
              task: true,
              subPhase: true
            }
          }
        }
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Group reports by month
  const reportsByMonth = project.dailyReports.reduce((acc, report) => {
    const monthKey = new Date(report.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    
    acc[monthKey].push(report);
    return acc;
  }, {} as Record<string, typeof project.dailyReports>);

  return (
    <div>
      <Link 
        href={`/dashboard/projects/${project.id}`} 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{project.name} - All Reports</h1>
        <p className="mt-2 text-gray-400">
          View and export all daily progress reports
        </p>
      </div>

      {project.dailyReports.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No daily reports yet</p>
          <Link 
            href="/dashboard/daily" 
            className="text-blue-600 hover:text-blue-400"
          >
            Create your first daily report
          </Link>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(reportsByMonth).map(([month, reports]) => (
            <div key={month}>
              <h2 className="text-xl font-semibold text-white mb-4">{month}</h2>
              <div className="grid gap-4">
                {reports.map((report) => {
                  const totalHours = report.progress.reduce((sum, p) => sum + p.hoursWorked, 0);
                  const totalQuantity = report.progress.reduce((sum, p) => sum + (p.quantityComplete || 0), 0);
                  const activitiesCount = report.progress.length;
                  
                  return (
                    <Card key={report.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <h3 className="font-semibold text-white">
                              {new Date(report.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </h3>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6 mt-4">
                            <div>
                              <p className="text-sm text-gray-400">Hours Worked</p>
                              <p className="text-lg font-medium text-white">
                                {totalHours.toFixed(1)} hrs
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Activities</p>
                              <p className="text-lg font-medium text-white">
                                {activitiesCount}
                              </p>
                            </div>
                            {totalQuantity > 0 && (
                              <div>
                                <p className="text-sm text-gray-400">Units Complete</p>
                                <p className="text-lg font-medium text-white">
                                  {totalQuantity.toFixed(1)}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {report.notes && (
                            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                              <p className="text-sm text-gray-400">Notes:</p>
                              <p className="text-sm text-white mt-1">{report.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-6">
                          <a
                            href={`/api/projects/${project.id}/export-pdf?date=${report.date.toISOString().split('T')[0]}`}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Export
                          </a>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}