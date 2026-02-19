"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  CheckCircle2, 
  Clock, 
  XCircle,
  Camera,
  Calendar,
  Activity
} from "lucide-react";

interface ProductivityEntry {
  id: string;
  date: Date;
  tasksCompleted: number;
  hoursWorked: number;
  points: number;
  notes: string | null;
  supervisorApproved: boolean | null;
  photoProof: string[];
  supervisor?: {
    name: string;
  } | null;
}

interface RecentEntriesProps {
  entries: ProductivityEntry[];
}

export default function RecentEntries({ entries }: RecentEntriesProps) {
  const getApprovalBadge = (approved: boolean | null) => {
    if (approved === true) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </Badge>
      );
    } else if (approved === false) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    } else {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
  };

  if (entries.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            No productivity entries yet. Start logging your work to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Recent Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.slice(-10).reverse().map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {getApprovalBadge(entry.supervisorApproved)}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Tasks</p>
                    <p className="font-semibold">{entry.tasksCompleted}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Hours</p>
                    <p className="font-semibold">{entry.hoursWorked}h</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Points</p>
                    <p className="font-semibold text-primary">{entry.points}</p>
                  </div>
                </div>

                {entry.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    "{entry.notes}"
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {entry.photoProof && entry.photoProof.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {entry.photoProof.length} photo{entry.photoProof.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {entry.supervisor && entry.supervisorApproved && (
                    <span>
                      Approved by {entry.supervisor.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}