"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, Clock, MapPin, Users, UserCheck } from "lucide-react";

interface Worker {
  id: string;
  name: string;
  phone: string;
  workerRole: string;
  status?: "pending" | "confirmed" | "declined";
  groupId?: string | null;
}

interface CrewTime {
  id?: string;
  name?: string;
  time: string;
  workers: Worker[];
}

interface Group {
  id: string;
  name: string;
  location: string;
  startTime: string;
  workers: Worker[];
  crewTimes?: CrewTime[];
}

interface AssignWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
  groups: Group[];
  onAssign: (workerId: string, groupId: string, crewTime?: string) => void;
}

export default function AssignWorkerDialog({
  open,
  onOpenChange,
  worker,
  groups,
  onAssign,
}: AssignWorkerDialogProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCrewSelection, setShowCrewSelection] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedGroup(null);
      setShowCrewSelection(false);
    }
  }, [open]);

  if (!worker) return null;

  const handleGroupSelect = (group: Group) => {
    // Check if group has crew times
    if (group.crewTimes && group.crewTimes.length > 0) {
      setSelectedGroup(group);
      setShowCrewSelection(true);
    } else {
      // Direct assignment to group
      onAssign(worker.id, group.id);
      onOpenChange(false);
    }
  };

  const handleCrewSelect = (crewTime?: string) => {
    if (selectedGroup) {
      onAssign(worker.id, selectedGroup.id, crewTime);
      onOpenChange(false);
    }
  };

  const handleRemoveFromProject = () => {
    if (worker.groupId) {
      onAssign(worker.id, "unassigned");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {showCrewSelection ? "Select Crew Time" : "Assign Worker to Project"}
          </DialogTitle>
        </DialogHeader>

        {!showCrewSelection ? (
          <div className="space-y-2">
            {/* Worker Info */}
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">{worker.name}</h3>
                  <p className="text-sm text-gray-400">{worker.workerRole}</p>
                  <p className="text-xs text-gray-500">{worker.phone}</p>
                </div>
                {worker.status && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    worker.status === 'confirmed'
                      ? 'bg-green-500/20 text-green-400'
                      : worker.status === 'declined'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {worker.status}
                  </span>
                )}
              </div>
            </div>

            {/* Current Assignment */}
            {worker.groupId && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-2">
                <p className="text-xs text-blue-400 mb-1">Currently assigned to:</p>
                <p className="text-sm font-medium text-blue-300">
                  {groups.find(g => g.id === worker.groupId)?.name || "Unknown Project"}
                </p>
                <Button
                  onClick={handleRemoveFromProject}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Remove from Project
                </Button>
              </div>
            )}

            {/* Available Projects */}
            <div className="space-y-1">
              <p className="text-sm text-gray-400 mb-2">Available Projects:</p>
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupSelect(group)}
                  className="w-full text-left p-3 rounded-lg border border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {group.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {group.location || "No location"}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {group.startTime}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.workers?.length || 0} workers
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>

            {/* Unassigned Option */}
            {worker.groupId && (
              <button
                onClick={() => {
                  onAssign(worker.id, "unassigned");
                  onOpenChange(false);
                }}
                className="w-full text-left p-3 rounded-lg border border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-400">Move to Unassigned</h4>
                    <p className="text-xs text-gray-500 mt-1">Remove from current project</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </div>
              </button>
            )}
          </div>
        ) : (
          // Crew Time Selection
          <div className="space-y-2">
            <button
              onClick={() => setShowCrewSelection(false)}
              className="text-sm text-gray-400 hover:text-white mb-2"
            >
              ← Back to projects
            </button>

            <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
              <h3 className="font-medium text-white">{selectedGroup?.name}</h3>
              <p className="text-sm text-gray-400">{selectedGroup?.location}</p>
            </div>

            <p className="text-sm text-gray-400 mb-2">Select Crew Time:</p>

            {/* Main Crew Option */}
            <button
              onClick={() => handleCrewSelect(undefined)}
              className="w-full text-left p-3 rounded-lg border border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white group-hover:text-blue-400">
                    Main Crew
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      Start: {selectedGroup?.startTime}
                    </span>
                    <span className="text-xs text-gray-500">
                      • {selectedGroup?.workers?.length || 0} workers
                    </span>
                  </div>
                </div>
                <UserCheck className="h-4 w-4 text-gray-500 group-hover:text-blue-400" />
              </div>
            </button>

            {/* Additional Crew Times */}
            {selectedGroup?.crewTimes?.map((crew, index) => (
              <button
                key={index}
                onClick={() => handleCrewSelect(crew.time)}
                className="w-full text-left p-3 rounded-lg border border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white group-hover:text-blue-400">
                      {crew.name || `Crew ${index + 1}`}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        Start: {crew.time}
                      </span>
                      <span className="text-xs text-gray-500">
                        • {crew.workers?.length || 0} workers
                      </span>
                    </div>
                  </div>
                  <UserCheck className="h-4 w-4 text-gray-500 group-hover:text-blue-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}