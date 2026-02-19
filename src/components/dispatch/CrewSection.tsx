"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Clock, Users, Trash2 } from "lucide-react";
import WorkerToken from "./WorkerToken";

interface Worker {
  id: string;
  name: string;
  phone: string;
  workerRole: string;
  status: "pending" | "confirmed" | "declined";
  groupId: string | null;
}

interface CrewSectionProps {
  crewId: string;
  crewName: string;
  startTime: string;
  workers: Worker[];
  onEditWorker?: (worker: Worker) => void;
  onDeleteWorker?: (workerId: string) => void;
  onDeleteCrew?: (crewId: string) => void;
}

export default function CrewSection({
  crewId,
  crewName,
  startTime,
  workers,
  onEditWorker,
  onDeleteWorker,
  onDeleteCrew,
}: CrewSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `crew-${crewId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        border rounded-md transition-all
        ${isOver ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-gray-800/30"}
      `}
    >
      {/* Crew Header */}
      <div className="px-3 py-2 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-white">{crewName}</span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              <span>{startTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="h-3 w-3" />
              <span>{workers.length}</span>
            </div>
            {onDeleteCrew && (
              <button
                onClick={() => {
                  if (confirm(`Delete ${crewName}? Workers will be moved to unassigned.`)) {
                    onDeleteCrew(crewId);
                  }
                }}
                className="p-1 rounded hover:bg-gray-700/50 transition-colors"
              >
                <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Crew Workers */}
      <div className="p-2 min-h-[100px] space-y-1">
        <SortableContext
          items={workers.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          {workers.map((worker) => (
            <WorkerToken
              key={worker.id}
              worker={worker}
              onEdit={onEditWorker}
              onDelete={onDeleteWorker}
            />
          ))}
        </SortableContext>

        {workers.length === 0 && (
          <div className="text-center text-gray-500 text-xs py-4">
            Drag workers here
          </div>
        )}
      </div>
    </div>
  );
}