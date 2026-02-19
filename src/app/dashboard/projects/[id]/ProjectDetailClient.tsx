"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProjectEditDialog } from "@/components/project/ProjectEditDialog";
import { PhasesEditDialog } from "@/components/phases/PhasesEditDialog";
import { Calendar, MapPin, Edit } from "lucide-react";

interface ProjectDetailClientProps {
  project: any;
  totalBudgetHours: number;
  totalActualHours: number;
  percentComplete: number;
  projectedTotalHours: number;
}

export function ProjectDetailClient({
  project,
  totalBudgetHours,
  totalActualHours,
  percentComplete,
  projectedTotalHours
}: ProjectDetailClientProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPhasesEditDialog, setShowPhasesEditDialog] = useState(false);
  const router = useRouter();

  const handleProjectUpdate = () => {
    router.refresh();
  };

  return (
    <>
      {/* Project Header with Edit Button */}
      <div className="mb-8">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <Button
              onClick={() => setShowEditDialog(true)}
              variant="outline"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-2 text-gray-400">
            {project.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {project.location}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Started {new Date(project.startDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>


      {/* Edit Dialog */}
      {showEditDialog && (
        <ProjectEditDialog
          project={project}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handleProjectUpdate}
        />
      )}

      {/* Phases Edit Dialog */}
      {showPhasesEditDialog && (
        <PhasesEditDialog
          projectId={project.id}
          open={showPhasesEditDialog}
          onOpenChange={setShowPhasesEditDialog}
          onSuccess={handleProjectUpdate}
        />
      )}
    </>
  );
}