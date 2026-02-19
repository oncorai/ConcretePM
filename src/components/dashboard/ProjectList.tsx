"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trash2, Plus } from "lucide-react";

interface Project {
  id: string;
  name: string;
  location: string | null;
  startDate: Date;
  tasks: any[];
  dailyReports: any[];
}

interface ProjectListProps {
  projects: Project[];
}

export default function ProjectList({ projects: initialProjects }: ProjectListProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(projectId);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(projects.filter(p => p.id !== projectId));
      router.refresh();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const lastReport = project.dailyReports[0];
        const totalTasks = project.tasks.length;
        const isDeleting = deletingId === project.id;
        
        return (
          <Card 
            key={project.id} 
            className={`relative group hover:shadow-lg transition-shadow h-full ${isDeleting ? 'opacity-50' : ''}`}
          >
            <Link href={`/dashboard/projects/${project.id}`} className="block p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {project.name}
                </h3>
                <Button
                  onClick={(e) => handleDelete(e, project.id, project.name)}
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              
              {project.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  {project.location}
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Started {new Date(project.startDate).toLocaleDateString()}
                </div>
                
                <div className="text-muted-foreground">
                  {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                </div>

                {lastReport && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Last update: {new Date(lastReport.date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          </Card>
        );
      })}
      
      <Link href="/dashboard/projects/new">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full flex items-center justify-center min-h-[200px] border-dashed">
          <div className="text-center">
            <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">New Project</p>
          </div>
        </Card>
      </Link>
    </div>
  );
}