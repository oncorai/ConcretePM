"use client";

import { useEffect, useState } from "react";
import AddGroupDialog from "@/components/dispatch/AddGroupDialog";
import AddWorkerDialog from "@/components/dispatch/AddWorkerDialog";
import UploadWorkersDialog from "@/components/dispatch/UploadWorkersDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Upload, Users, MessageSquare, UserCircle, Send, ChevronLeft, ChevronRight } from "lucide-react";

interface Worker {
  id: string;
  name: string;
  phone: string;
  workerRole: string;
  status: "pending" | "confirmed" | "declined";
  groupId: string | null;
}

interface Crew {
  id: string;
  name: string;
  role?: string;
}

interface Group {
  id: string;
  name: string;
  location?: string;
  startTime: string;
  time?: string;
  crews?: Crew[];
}

export default function DispatchPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsRes, workersRes] = await Promise.all([
        fetch("/api/dispatch/groups"),
        fetch("/api/dispatch/workers"),
      ]);

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }

      if (workersRes.ok) {
        const workersData = await workersRes.json();
        setWorkers(workersData);
      }
    } catch (error) {
      console.error("Failed to load dispatch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerClick = (worker: Worker) => {
    console.log("Worker clicked:", worker.name);
    setSelectedWorker(worker);
    setShowAssignDialog(true);
  };

  const handleAssignToGroup = async (groupId: string) => {
    console.log("Group selected, selectedWorker:", selectedWorker);
    if (!selectedWorker) {
      console.log("No worker selected");
      return;
    }

    console.log("Assigning worker", selectedWorker.name, "to group", groupId);

    // OPTIMIZATION: Optimistically update UI before API call
    setWorkers(prev => prev.map(w =>
      w.id === selectedWorker.id ? { ...w, groupId } : w
    ));
    setShowAssignDialog(false);
    setSelectedWorker(null);

    try {
      const response = await fetch("/api/dispatch/workers/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: selectedWorker.id, groupId }),
      });

      if (!response.ok) {
        console.error("Assignment failed:", await response.text());
        // Revert optimistic update on error
        await loadData();
      } else {
        console.log("Assignment successful");
      }
    } catch (error) {
      console.error("Failed to assign worker:", error);
      // Revert optimistic update on error
      await loadData();
    }
  };

  const handleSendAll = async () => {
    // TODO: Implement send all notifications
    console.log("Sending notifications to all workers");
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const unassignedWorkers = workers.filter((w) => !w.groupId);
  const assignedCount = workers.filter((w) => w.groupId).length;

  const getRoleColor = (role: string) => {
    const roleMap: Record<string, string> = {
      "project manager": "bg-blue-500",
      "superintendent": "bg-green-500",
      "foreman": "bg-purple-500",
      "carpenter": "bg-orange-500",
      "operator": "bg-yellow-500",
      "finisher": "bg-indigo-500",
      "sawcutter": "bg-amber-500",
      "patcher": "bg-pink-500",
      "laborer": "bg-teal-500",
      "field engineer": "bg-emerald-500",
      "safety": "bg-lime-500",
      "other": "bg-gray-500"
    };
    return roleMap[role?.toLowerCase()] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dispatch</h1>
            <p className="text-gray-400 mt-1">Manage workers and job assignments</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dispatch</h1>
          <p className="text-gray-400 mt-1">Manage workers and job assignments</p>
        </div>
      </div>

      <Tabs defaultValue="dispatch" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="dispatch">
            <Users className="h-4 w-4 mr-2" />
            Dispatch
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="employees">
            <UserCircle className="h-4 w-4 mr-2" />
            Employees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dispatch" className="space-y-6">
          {/* Date Navigation and Send All Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-card border border-gray-700 rounded-lg p-2">
              <Button variant="ghost" size="sm" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-white px-4">{formatDate(selectedDate)}</span>
              <Button variant="ghost" size="sm" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" onClick={handleSendAll}>
              <Send className="h-4 w-4 mr-2" />
              Send All
            </Button>
          </div>

          <div className="flex gap-6">
            {/* Main Dispatch Area */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowAddGroup(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const crews = group.crews || [];
                  const groupWorkers = workers.filter(w => w.groupId === group.id);

                  return (
                    <div
                      key={group.id}
                      className="bg-card border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white">{group.name}</h3>
                        <button className="text-gray-400 hover:text-white">⋮</button>
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-2">
                          <span>🕐 {group.startTime || group.time || '7:00 AM'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>{groupWorkers.length} workers</span>
                        </div>
                      </div>

                      {/* Crew Members */}
                      {groupWorkers.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1 flex justify-between items-center">
                            <span>Crew Members</span>
                            <span className="text-gray-600">{group.startTime || '7:00 AM'}</span>
                          </div>
                          <div className="space-y-1">
                            {groupWorkers.map((worker) => (
                              <div
                                key={worker.id}
                                className={`${getRoleColor(worker.workerRole)} text-white px-3 py-2 rounded text-sm flex items-center justify-between cursor-pointer`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWorkerClick(worker);
                                }}
                              >
                                {worker.name}
                                <span className="text-xs">⊕</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {crews.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">Crews</div>
                          <div className="space-y-1">
                            {crews.map((crew) => (
                              <div
                                key={crew.id}
                                className="bg-gray-600 text-white px-3 py-2 rounded text-sm"
                              >
                                {crew.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {groupWorkers.length === 0 && crews.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-4">
                          Click to assign workers
                        </div>
                      )}

                      {/* Status Footer */}
                      <div className="text-xs text-gray-500 mt-3 flex justify-between">
                        <span>0 confirmed</span>
                        <span>{groupWorkers.length} pending</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar - Available Workers */}
            <div className="w-80 space-y-4">
              <div className="bg-card border border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">
                  Available Workers ({unassignedWorkers.length})
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Manage workers in the Employees tab
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {unassignedWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      className={`${getRoleColor(worker.workerRole)} ${
                        selectedWorker?.id === worker.id ? 'ring-2 ring-white' : ''
                      } text-white px-3 py-2 rounded text-sm cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => handleWorkerClick(worker)}
                    >
                      {worker.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-card border border-gray-700 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Total Workers</span>
                    <span className="font-semibold">{workers.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Groups</span>
                    <span className="font-semibold">{groups.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Assigned</span>
                    <span className="font-semibold">{assignedCount} / {workers.length}</span>
                  </div>
                </div>
              </div>

              {/* Role Colors Legend */}
              <div className="bg-card border border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">Role Colors</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-gray-300">Project Manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-gray-300">Superintendent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span className="text-gray-300">Foreman</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span className="text-gray-300">Carpenter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span className="text-gray-300">Operator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-500"></div>
                    <span className="text-gray-300">Finisher</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    <span className="text-gray-300">Sawcutter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-pink-500"></div>
                    <span className="text-gray-300">Patcher</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-teal-500"></div>
                    <span className="text-gray-300">Laborer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                    <span className="text-gray-300">Field Engineer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-lime-500"></div>
                    <span className="text-gray-300">Safety</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-500"></div>
                    <span className="text-gray-300">Other</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="bg-card border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400">Messages coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Workers
            </Button>
            <Button size="sm" onClick={() => setShowAddWorker(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </div>

          <div className="bg-card border border-gray-700 rounded-lg p-6">
            <div className="space-y-4">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <div>
                    <p className="font-medium text-white">{worker.name}</p>
                    <p className="text-sm text-gray-400">{worker.phone}</p>
                    <p className="text-xs text-gray-500">{worker.workerRole}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      worker.status === 'confirmed' ? 'bg-green-900/20 text-green-400' :
                      worker.status === 'declined' ? 'bg-red-900/20 text-red-400' :
                      'bg-yellow-900/20 text-yellow-400'
                    }`}>
                      {worker.status}
                    </span>
                    {worker.groupId && (
                      <span className="text-xs text-gray-500">
                        Assigned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AddGroupDialog
        open={showAddGroup}
        onOpenChange={setShowAddGroup}
        onSubmit={async () => {
          setShowAddGroup(false);
          await loadData(); // Only refetch after adding new group
        }}
      />
      <AddWorkerDialog
        open={showAddWorker}
        onOpenChange={setShowAddWorker}
        onSubmit={async () => {
          setShowAddWorker(false);
          await loadData(); // Only refetch after adding new worker
        }}
      />
      <UploadWorkersDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        onUploadComplete={() => {
          setShowUpload(false);
          loadData(); // Only refetch after upload complete
        }}
      />

      {/* Worker Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Assign {selectedWorker?.name} to Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto py-4">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => handleAssignToGroup(group.id)}
                className="w-full text-left px-4 py-3 bg-card hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{group.name}</p>
                    {group.location && (
                      <p className="text-sm text-gray-400">{group.location}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {group.startTime || group.time || '7:00 AM'}
                    </p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </button>
            ))}
            {groups.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                No projects available. Create a project first.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
