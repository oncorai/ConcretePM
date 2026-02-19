"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Plus, Trash2, Calendar } from "lucide-react";

interface Project {
  id: string;
  name: string;
  tasks: Task[];
  phases?: Phase[];
}

interface Task {
  id: string;
  name: string;
  budgetHours: number;
  budgetQuantity: number | null;
  unit: string | null;
}

interface Phase {
  id: string;
  name: string;
  orderIndex: number;
  subPhases: SubPhase[];
}

interface SubPhase {
  id: string;
  name: string;
  budgetHours: number;
  budgetQuantity: number | null;
  unit: string | null;
  initialHours: number;
  initialQuantity: number | null;
}

interface ProgressEntry {
  taskId?: string;
  subPhaseId?: string;
  hoursWorked: string;
  quantityComplete: string;
}

export default function DailyEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        // Use phases/subphases if available, otherwise fall back to tasks
        if (project.phases && project.phases.length > 0) {
          const progressEntries: ProgressEntry[] = [];
          project.phases.forEach(phase => {
            phase.subPhases.forEach(subPhase => {
              progressEntries.push({
                subPhaseId: subPhase.id,
                hoursWorked: "",
                quantityComplete: "",
              });
            });
          });
          setProgress(progressEntries);
        } else {
          // Fallback to legacy tasks
          setProgress(
            project.tasks.map(task => ({
              taskId: task.id,
              hoursWorked: "",
              quantityComplete: "",
            }))
          );
        }
      }
    }
  }, [selectedProjectId, projects]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const updateProgress = (id: string, field: 'hoursWorked' | 'quantityComplete', value: string, isSubPhase: boolean = true) => {
    setProgress(prev => 
      prev.map(p => {
        if (isSubPhase && p.subPhaseId === id) {
          return { ...p, [field]: value };
        } else if (!isSubPhase && p.taskId === id) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/daily-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          date: new Date(date),
          notes,
          progress: progress
            .filter(p => p.hoursWorked || p.quantityComplete)
            .map(p => ({
              taskId: p.taskId,
              subPhaseId: p.subPhaseId,
              hoursWorked: parseFloat(p.hoursWorked) || 0,
              quantityComplete: p.quantityComplete ? parseFloat(p.quantityComplete) : null,
            })),
        }),
      });

      if (!response.ok) throw new Error("Failed to create daily report");

      router.push(`/dashboard/projects/${selectedProjectId}`);
    } catch (error) {
      console.error("Error creating daily report:", error);
      alert("Failed to create daily report");
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card className="max-w-4xl">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Daily Progress Report</h1>
          <p className="mt-1 text-muted-foreground">
            Log today's progress for your project tasks
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project & Date Selection */}
          <div className="grid gap-6 grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Project *
              </label>
              <select
                required
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Progress Entry */}
          {selectedProject && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Progress Entry</h3>
              <div className="space-y-6">
                {selectedProject.phases && selectedProject.phases.length > 0 ? (
                  // New phases/subphases structure
                  selectedProject.phases.map((phase) => (
                    <div key={phase.id} className="space-y-4">
                      <h4 className="font-medium text-foreground">{phase.name}</h4>
                      <div className="space-y-3 pl-4">
                        {phase.subPhases.map((subPhase) => {
                          const progressEntry = progress.find(p => p.subPhaseId === subPhase.id);
                          const remainingHours = subPhase.budgetHours - subPhase.initialHours;
                          const remainingQuantity = subPhase.budgetQuantity ? 
                            subPhase.budgetQuantity - (subPhase.initialQuantity || 0) : null;
                          
                          return (
                            <div key={subPhase.id} className="grid gap-4 grid-cols-3 p-4 bg-muted rounded-lg">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                  {subPhase.name}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  Remaining: {remainingHours.toFixed(1)} hrs
                                  {remainingQuantity && ` / ${remainingQuantity.toFixed(1)} ${subPhase.unit}`}
                                </p>
                                {subPhase.initialHours > 0 && (
                                  <p className="text-xs text-gray-500">
                                    Previously: {subPhase.initialHours} hrs
                                    {subPhase.initialQuantity && ` / ${subPhase.initialQuantity} ${subPhase.unit}`}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                  Hours Worked Today
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={progressEntry?.hoursWorked || ""}
                                  onChange={(e) => updateProgress(subPhase.id, 'hoursWorked', e.target.value, true)}
                                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-foreground placeholder-muted-foreground"
                                  placeholder="0"
                                />
                              </div>

                              {subPhase.budgetQuantity && (
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-1">
                                    Quantity Complete Today ({subPhase.unit})
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={progressEntry?.quantityComplete || ""}
                                    onChange={(e) => updateProgress(subPhase.id, 'quantityComplete', e.target.value, true)}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-foreground placeholder-muted-foreground"
                                    placeholder="0"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  // Legacy tasks structure
                  <div className="space-y-4">
                    {selectedProject.tasks.map((task) => {
                      const progressEntry = progress.find(p => p.taskId === task.id);
                      return (
                        <div key={task.id} className="grid gap-4 grid-cols-3 p-4 bg-muted rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              {task.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Budget: {task.budgetHours} hrs
                              {task.budgetQuantity && ` / ${task.budgetQuantity} ${task.unit}`}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Hours Worked
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={progressEntry?.hoursWorked || ""}
                              onChange={(e) => updateProgress(task.id, 'hoursWorked', e.target.value, false)}
                              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-foreground placeholder-muted-foreground"
                              placeholder="0"
                            />
                          </div>

                          {task.budgetQuantity && (
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Quantity Complete ({task.unit})
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={progressEntry?.quantityComplete || ""}
                                onChange={(e) => updateProgress(task.id, 'quantityComplete', e.target.value, false)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-foreground placeholder-muted-foreground"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
              placeholder="Any important notes about today's work..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading || !selectedProjectId || progress.every(p => !p.hoursWorked)}
            >
              {loading ? "Saving..." : "Save Daily Report"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}