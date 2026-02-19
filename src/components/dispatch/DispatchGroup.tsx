"use client";

import { useDroppable, useDndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MapPin, Clock, Users, Edit2, Trash2, MoreVertical, Plus } from "lucide-react";
import WorkerToken from "./WorkerToken";
import CrewTimeSection from "./CrewTimeSection";
import { useState, useMemo } from "react";

interface Worker {
  id: string;
  name: string;
  phone: string;
  workerRole: string;
  status: "pending" | "confirmed" | "declined";
  groupId: string | null;
}

interface CrewTime {
  name: string;
  time: string;
  workers: Worker[];
}

interface Group {
  id: string;
  name: string;
  location?: string;
  startTime: string;
  projectManager?: Worker | null;
  superintendent?: Worker | null;
  workers: Worker[];
  crewTimes?: CrewTime[];
}

interface DispatchGroupProps {
  group: Group;
  onEdit?: (group: Group) => void;
  onDelete?: (groupId: string) => void;
  onEditWorker?: (worker: Worker) => void;
  onDeleteWorker?: (workerId: string) => void;
  onAddCrewTime?: (groupId: string) => void;
  activeWorkerRole?: string | null;
  onAssignWorker?: (worker: Worker) => void;
}

export default function DispatchGroup({ group, onEdit, onDelete, onEditWorker, onDeleteWorker, onAddCrewTime, activeWorkerRole, onAssignWorker }: DispatchGroupProps) {
  const isUnassigned = group.id === "unassigned";

  // Check if the dragged worker can go in PM or Super slots
  const canDropInPMSlot = activeWorkerRole?.toLowerCase().trim() === 'project manager';
  const canDropInSuperSlot = activeWorkerRole?.toLowerCase().trim() === 'superintendent';

  // Main droppable for the entire group (used for unassigned only)
  const { setNodeRef, isOver } = useDroppable({
    id: isUnassigned ? 'unassigned' : `group-${group.id}`,
    disabled: !isUnassigned, // Only allow drops for unassigned
  });

  // Crew members droppable area (for regular groups)
  const { setNodeRef: setCrewNodeRef, isOver: isCrewOver } = useDroppable({
    id: `${group.id}-crew`,
    disabled: isUnassigned,
  });

  // Main crew droppable area (when crew times exist)
  const { setNodeRef: setMainCrewNodeRef, isOver: isMainCrewOver } = useDroppable({
    id: `${group.id}-main-crew`,
    disabled: isUnassigned,
  });

  const { setNodeRef: setPMNodeRef, isOver: isPMOver } = useDroppable({
    id: `${group.id}-project-manager`,
    disabled: isUnassigned || !canDropInPMSlot,
  });

  const { setNodeRef: setSuperNodeRef, isOver: isSuperOver } = useDroppable({
    id: `${group.id}-superintendent`,
    disabled: isUnassigned || !canDropInSuperSlot,
  });

  const [showMenu, setShowMenu] = useState(false);

  const groupClassName = `flex flex-col bg-gray-800/50 backdrop-blur rounded-lg border ${
    isOver ? "border-blue-500 ring-2 ring-blue-500/20 bg-gray-800/70" : "border-gray-700"
  } w-full min-w-[280px] min-h-[200px] max-h-[calc(100vh-10rem)]`;

  return (
    <div
      ref={setNodeRef}
      className={groupClassName}
    >
      {/* Header */}
      <div className={`p-3 border-b border-gray-700 ${isUnassigned ? "bg-gray-700/30" : "bg-gray-800/60"}`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-white text-sm">{group.name}</h3>
          {!isUnassigned && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700/50 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 min-w-[150px]">
                  <button
                    onClick={() => {
                      // Add edit/delete options here if needed
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
                  >
                    Edit Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {!isUnassigned && (
          <div className="space-y-1.5 text-xs text-gray-300">
            {group.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span>{group.location}</span>
              </div>
            )}
            {group.startTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-gray-400" />
                <span>{group.startTime}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-white">
                {(group.workers?.length || 0) +
                 (group.crewTimes?.reduce((sum, ct) => sum + (ct.workers?.length || 0), 0) || 0) +
                 (group.projectManager ? 1 : 0) +
                 (group.superintendent ? 1 : 0)}
              </span>
              <span>workers</span>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {!isUnassigned ? (
          <div className="space-y-2">
            {/* Project Manager Slot */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-2">
              <div className="text-xs text-blue-400 font-semibold mb-1.5 flex items-center gap-1">
                <span className="block w-2 h-2 bg-blue-500 rounded-full"></span>
                Project Manager
              </div>
              <div
                ref={setPMNodeRef}
                className={`min-h-[50px] rounded border p-1.5 transition-all ${
                  isPMOver
                    ? 'bg-blue-900/40 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-gray-900/30 border-gray-700/50'
                }`}>
                {group.projectManager ? (
                  <WorkerToken
                    worker={group.projectManager}
                    onEdit={onEditWorker}
                    onDelete={onDeleteWorker}
                    onAssign={onAssignWorker}
                    compact
                  />
                ) : (
                  <div className="text-center text-gray-600 text-xs py-3">
                    Assign Project Manager
                  </div>
                )}
              </div>
            </div>

            {/* Superintendent Slot */}
            <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-2">
              <div className="text-xs text-green-400 font-semibold mb-1.5 flex items-center gap-1">
                <span className="block w-2 h-2 bg-green-500 rounded-full"></span>
                Superintendent
              </div>
              <div
                ref={setSuperNodeRef}
                className={`min-h-[50px] rounded border p-1.5 transition-all ${
                  isSuperOver
                    ? 'bg-green-900/40 border-green-500 ring-2 ring-green-500/20'
                    : 'bg-gray-900/30 border-gray-700/50'
                }`}>
                {group.superintendent ? (
                  <WorkerToken
                    worker={group.superintendent}
                    onEdit={onEditWorker}
                    onDelete={onDeleteWorker}
                    onAssign={onAssignWorker}
                    compact
                  />
                ) : (
                  <div className="text-center text-gray-600 text-xs py-3">
                    Assign Superintendent
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-2"></div>

            {/* Crew Members Section */}
            <div className="text-xs text-gray-400 font-semibold mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Crew Members</span>
                {!group.crewTimes?.length && group.startTime && (
                  <span className="text-gray-500 font-normal flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {group.startTime}
                  </span>
                )}
              </div>
              <button
                onClick={() => onAddCrewTime && onAddCrewTime(group.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Crew Time
              </button>
            </div>

            {group.crewTimes && group.crewTimes.length > 0 ? (
              /* Show crew time sections */
              <div className="space-y-2">
                {/* Main crew at project time */}
                <div
                  ref={setMainCrewNodeRef}
                  className={`bg-gray-800/30 rounded-md border p-3 min-h-[120px] transition-all ${
                    isMainCrewOver ? 'border-blue-500 ring-2 ring-blue-500/20 bg-gray-800/50' : 'border-gray-700/50'
                  }`}>
                  <div className="text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-2">
                    <span>Main Crew</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3 w-3" />
                      {group.startTime}
                    </span>
                  </div>
                  <SortableContext
                    items={(group.workers || []).map((w) => w.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-1 min-h-[60px]">
                      {(group.workers || []).map((worker) => (
                        <WorkerToken
                          key={worker.id}
                          worker={worker}
                          onEdit={onEditWorker}
                          onDelete={onDeleteWorker}
                          onAssign={onAssignWorker}
                          compact
                        />
                      ))}
                      {(!group.workers || group.workers.length === 0) && (
                        <div className="text-center text-gray-500 text-xs py-2">
                          Drop workers for {group.startTime} start
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>

                {/* Additional crew time sections */}
                {group.crewTimes.map((crew, index) => (
                  <CrewTimeSection
                    key={`${group.id}-crew-${index}`}
                    groupId={group.id}
                    name={crew.name || `Crew ${index + 2}`}
                    time={crew.time}
                    workers={crew.workers || []}
                    onEditWorker={onEditWorker}
                    onDeleteWorker={onDeleteWorker}
                    onAssignWorker={onAssignWorker}
                  />
                ))}
              </div>
            ) : (
              /* Regular workers list when no crew times */
              <div
                ref={setCrewNodeRef}
                className={`bg-gray-800/30 rounded-md border p-3 transition-all min-h-[120px] ${
                  isCrewOver ? 'border-blue-500 ring-2 ring-blue-500/20 bg-gray-800/50' : 'border-gray-700/50'
                }`}
              >
                <SortableContext
                  items={(group.workers || []).map((w) => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-1 min-h-[80px]">
                    {(group.workers || []).map((worker) => (
                      <WorkerToken
                        key={worker.id}
                        worker={worker}
                        onEdit={onEditWorker}
                        onDelete={onDeleteWorker}
                        compact
                      />
                    ))}
                    {(!group.workers || group.workers.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="text-gray-500 text-xs mb-3">
                          Drag workers here to assign to crew
                        </div>
                        {onAddCrewTime && (
                          <button
                            onClick={() => onAddCrewTime(group.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            Create Crew Time
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            )}
          </div>
        ) : (
          /* Unassigned workers section */
          <>
            <SortableContext
              items={(group.workers || []).map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1">
                {(group.workers || []).map((worker) => (
                  <WorkerToken
                    key={worker.id}
                    worker={worker}
                    onEdit={onEditWorker}
                    onDelete={onDeleteWorker}
                    compact
                  />
                ))}
              </div>
            </SortableContext>

            {(!group.workers || group.workers.length === 0) && (
              <div className="text-center text-gray-500 text-sm py-8">
                Add workers to start dispatching
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary */}
      {!isUnassigned && group.workers && group.workers.length > 0 && (
        <div className="p-2 border-t text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>
              {(group.workers || []).filter((w) => w.status === "confirmed").length}{" "}
              confirmed
            </span>
            <span>
              {(group.workers || []).filter((w) => w.status === "pending").length}{" "}
              pending
            </span>
          </div>
        </div>
      )}
    </div>
  );
}