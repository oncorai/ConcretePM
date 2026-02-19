"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Camera,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductivityEntry {
  id: string;
  workerId: string;
  date: Date;
  tasksCompleted: number;
  hoursWorked: number;
  notes: string | null;
  points: number;
  photoProof: string[];
  worker: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
}

interface ApprovalsViewProps {
  entries: ProductivityEntry[];
}

export default function ApprovalsView({ entries }: ApprovalsViewProps) {
  const router = useRouter();
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handleApproval = async (entryId: string, approved: boolean) => {
    setApproving(entryId);
    
    try {
      const response = await fetch(`/api/productivity/${entryId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Approval error:", error);
    } finally {
      setApproving(null);
    }
  };

  const viewPhotos = (photos: string[]) => {
    setSelectedPhotos(photos);
    setShowPhotoModal(true);
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pending Approvals
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve worker productivity entries
          </p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No pending approvals</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pending Approvals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and approve worker productivity entries
        </p>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id} className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {entry.worker.user.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant="warning" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Work Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tasks Completed</p>
                  <p className="text-xl font-semibold">{entry.tasksCompleted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hours Worked</p>
                  <p className="text-xl font-semibold">{entry.hoursWorked}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Points Earned</p>
                  <p className="text-xl font-semibold">{entry.points}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Photo Proof</p>
                  <p className="text-xl font-semibold">
                    {entry.photoProof.length > 0 ? (
                      <button
                        onClick={() => viewPhotos(entry.photoProof)}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Camera className="h-4 w-4" />
                        {entry.photoProof.length} photos
                      </button>
                    ) : (
                      <span className="text-gray-400">No photos</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {entry.notes && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Worker Notes:</p>
                  <p className="text-gray-700 dark:text-gray-300">{entry.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleApproval(entry.id, false)}
                  disabled={approving === entry.id}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproval(entry.id, true)}
                  disabled={approving === entry.id}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {approving === entry.id ? "Approving..." : "Approve"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photo Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Work Photos</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPhotoModal(false)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedPhotos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Work photo ${index + 1}`}
                  className="w-full rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}