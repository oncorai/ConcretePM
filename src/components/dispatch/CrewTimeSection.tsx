"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Clock } from "lucide-react";
import WorkerToken from "./WorkerToken";

interface Worker {
  id: string;
  name: string;
  phone: string;
  workerRole: string;
  status: "pending" | "confirmed" | "declined";
  groupId: string | null;
  crewTime?: string;
}

interface CrewTimeSectionProps {
  groupId: string;
  name: string;
  time: string;
  workers: Worker[];
  onEditWorker?: (worker: Worker) => void;
  onDeleteWorker?: (workerId: string) => void;
  onAssignWorker?: (worker: Worker) => void;
}

// Define color classes for different crew times
const getCrewColor = (time: string): { bg: string; border: string; text: string } => {
  const hour = parseInt(time.split(':')[0]);
  const isPM = time.includes('PM');
  const actualHour = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);

  // Early morning (12AM - 5AM) - Purple
  if (actualHour >= 0 && actualHour < 5) {
    return { bg: "bg-purple-900/30", border: "border-purple-700", text: "text-purple-400" };
  }
  // Morning (5AM - 7AM) - Blue
  if (actualHour >= 5 && actualHour < 7) {
    return { bg: "bg-blue-900/30", border: "border-blue-700", text: "text-blue-400" };
  }
  // Regular hours (7AM - 12PM) - Green
  if (actualHour >= 7 && actualHour < 12) {
    return { bg: "bg-green-900/30", border: "border-green-700", text: "text-green-400" };
  }
  // Afternoon (12PM - 5PM) - Yellow/Orange
  if (actualHour >= 12 && actualHour < 17) {
    return { bg: "bg-orange-900/30", border: "border-orange-700", text: "text-orange-400" };
  }
  // Evening (5PM - 11PM) - Red
  if (actualHour >= 17 && actualHour <= 23) {
    return { bg: "bg-red-900/30", border: "border-red-700", text: "text-red-400" };
  }

  return { bg: "bg-gray-800/30", border: "border-gray-700", text: "text-gray-400" };
};

export default function CrewTimeSection({
  groupId,
  name,
  time,
  workers,
  onEditWorker,
  onDeleteWorker,
  onAssignWorker,
}: CrewTimeSectionProps) {
  // Create a safe ID by encoding the name
  const safeCrewId = encodeURIComponent(name.replace(/\s+/g, '_'));
  const dropId = `${groupId}-crew-${safeCrewId}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: {
      type: 'crew',
      groupId,
      crewName: name,
      crewTime: time
    }
  });

  const colors = getCrewColor(time);

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md transition-all border ${colors.border} ${colors.bg} ${
        isOver ? "ring-2 ring-blue-500 scale-[1.02]" : ""
      }`}
    >
      {/* Crew Header */}
      <div className={`px-3 py-2 border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${colors.text}`}>{name}</span>
            <div className={`flex items-center gap-1 ${colors.text} opacity-80`}>
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{time}</span>
            </div>
          </div>
          <span className={`text-xs ${colors.text} opacity-70`}>
            {workers.length} {workers.length === 1 ? 'worker' : 'workers'}
          </span>
        </div>
      </div>

      {/* Workers Drop Zone */}
      <div className="p-3 min-h-[120px]">
        <SortableContext
          items={workers.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1">
            {workers.map((worker) => (
              <WorkerToken
                key={worker.id}
                worker={worker}
                onEdit={onEditWorker}
                onDelete={onDeleteWorker}
                onAssign={onAssignWorker}
                compact
              />
            ))}
          </div>
        </SortableContext>

        {workers.length === 0 && (
          <div className={`text-center text-xs py-3 ${colors.text} opacity-50`}>
            Drop crew members here for {time} start
          </div>
        )}
      </div>
    </div>
  );
}