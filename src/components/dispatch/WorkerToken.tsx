"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Phone, User, CheckCircle, XCircle, Clock, GripVertical, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  phone: string;
  workerRole: string;
  status: "pending" | "confirmed" | "declined";
  groupId: string | null;
}

interface WorkerTokenProps {
  worker: Worker;
  isDragging?: boolean;
  onEdit?: (worker: Worker) => void;
  onDelete?: (workerId: string) => void;
  onAssign?: (worker: Worker) => void;
  compact?: boolean;
}

const roleColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  "project manager": {
    bg: "bg-blue-500 dark:bg-blue-600",
    border: "border-blue-600 dark:border-blue-700",
    text: "text-white",
    badge: "bg-blue-700"
  },
  superintendent: {
    bg: "bg-green-500 dark:bg-green-600",
    border: "border-green-600 dark:border-green-700",
    text: "text-white",
    badge: "bg-green-700"
  },
  foreman: {
    bg: "bg-purple-500 dark:bg-purple-600",
    border: "border-purple-600 dark:border-purple-700",
    text: "text-white",
    badge: "bg-purple-700"
  },
  carpenter: {
    bg: "bg-orange-500 dark:bg-orange-600",
    border: "border-orange-600 dark:border-orange-700",
    text: "text-white",
    badge: "bg-orange-700"
  },
  operator: {
    bg: "bg-red-500 dark:bg-red-600",
    border: "border-red-600 dark:border-red-700",
    text: "text-white",
    badge: "bg-red-700"
  },
  finisher: {
    bg: "bg-indigo-500 dark:bg-indigo-600",
    border: "border-indigo-600 dark:border-indigo-700",
    text: "text-white",
    badge: "bg-indigo-700"
  },
  sawcutter: {
    bg: "bg-yellow-500 dark:bg-yellow-600",
    border: "border-yellow-600 dark:border-yellow-700",
    text: "text-white",
    badge: "bg-yellow-700"
  },
  patcher: {
    bg: "bg-pink-500 dark:bg-pink-600",
    border: "border-pink-600 dark:border-pink-700",
    text: "text-white",
    badge: "bg-pink-700"
  },
  laborer: {
    bg: "bg-emerald-500 dark:bg-emerald-600",
    border: "border-emerald-600 dark:border-emerald-700",
    text: "text-white",
    badge: "bg-emerald-700"
  },
  "field engineer": {
    bg: "bg-teal-500 dark:bg-teal-600",
    border: "border-teal-600 dark:border-teal-700",
    text: "text-white",
    badge: "bg-teal-700"
  },
  safety: {
    bg: "bg-lime-500 dark:bg-lime-600",
    border: "border-lime-600 dark:border-lime-700",
    text: "text-white",
    badge: "bg-lime-700"
  },
  default: {
    bg: "bg-gray-500 dark:bg-gray-600",
    border: "border-gray-600 dark:border-gray-700",
    text: "text-white",
    badge: "bg-gray-700"
  }
};

const statusIcons = {
  confirmed: <CheckCircle className="h-3 w-3 text-green-300" />,
  declined: <XCircle className="h-3 w-3 text-red-300" />,
  pending: <Clock className="h-3 w-3 text-yellow-300" />,
};

export default function WorkerToken({ worker, isDragging, onEdit, onDelete, onAssign, compact }: WorkerTokenProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: worker.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Normalize role name - handle plurals and variations
  const normalizedRole = worker.workerRole?.toLowerCase()
    .replace(/s$/, '') // Remove plural 's'
    .replace(/[^a-z ]/g, '') // Remove special characters
    .trim();

  const colors = roleColors[normalizedRole] || roleColors.default;

  // For compact mode, show smaller but informative tokens
  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "rounded-md px-2 py-1 border transition-all select-none flex items-center gap-1.5 w-full",
          colors.bg,
          colors.border,
          colors.text,
          (isDragging || isSortableDragging) && "opacity-75 shadow-2xl scale-105",
          "hover:shadow-md text-xs",
          onAssign ? "cursor-pointer hover:scale-[1.02]" : "cursor-move active:cursor-grabbing"
        )}
        title={`${worker.name} - ${worker.workerRole}`}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-move"
        >
          <GripVertical className="h-3 w-3 text-white/30 flex-shrink-0" />
        </div>
        <div
          className="flex-1 flex items-center gap-1.5"
          onClick={() => onAssign && onAssign(worker)}
        >
          <span className="font-medium whitespace-nowrap flex-1">
            {worker.name}
          </span>
          <span className="flex-shrink-0">{statusIcons[worker.status]}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative rounded-md border cursor-move transition-all select-none",
        "p-1.5",
        colors.bg,
        colors.border,
        colors.text,
        (isDragging || isSortableDragging) && "opacity-75 shadow-2xl scale-105",
        "hover:shadow-md active:cursor-grabbing"
      )}
    >
      {/* Actions */}
      <div className="absolute right-1 top-1 flex items-center gap-0.5">
        {(onEdit || onDelete) && (
          <div className="flex gap-0.5">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(worker);
                }}
                className="p-0.5 rounded hover:bg-white/20 transition-colors"
              >
                <Edit2 className="h-3 w-3 text-white/60" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove ${worker.name} from dispatch?`)) {
                    onDelete(worker.id);
                  }
                }}
                className="p-0.5 rounded hover:bg-white/20 transition-colors"
              >
                <Trash2 className="h-3 w-3 text-white/60" />
              </button>
            )}
          </div>
        )}
        <GripVertical className="h-3 w-3 text-white/30" />
      </div>

      <div className="pr-8">
        {/* Name - more prominent, split if needed */}
        <div className="font-semibold text-sm mb-0.5">
          {worker.name.split(' ').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && ' '}
            </span>
          ))}
        </div>

        {/* Role and Phone on same line */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            "px-1.5 py-0.5 rounded text-xs font-medium text-white capitalize",
            colors.badge
          )}>
            {worker.workerRole || "Worker"}
          </span>

          {/* Phone - smaller and less prominent */}
          <div className="flex items-center gap-0.5 text-xs text-white/60">
            <Phone className="h-2.5 w-2.5" />
            <span className="text-xs">{worker.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}