"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Edit, Plus, FileEdit } from "lucide-react";
import { PhasesEditDialog } from "./PhasesEditDialog";
import ProgressEditDialog from "@/components/progress/ProgressEditDialog";
import Link from "next/link";

interface PhasesSectionProps {
  projectId: string;
  children: React.ReactNode;
  progressData?: Array<{
    id: string;
    subPhaseId: string;
    subPhaseName: string;
    costCode: string;
    hoursWorked: number;
    quantityComplete: number;
    unit: string;
    date: string;
  }>;
}

export function PhasesSection({ projectId, children, progressData }: PhasesSectionProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProgressEditDialog, setShowProgressEditDialog] = useState(false);
  const router = useRouter();

  const handlePhasesUpdate = () => {
    router.refresh();
  };

  return (
    <>
      <Card>
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Manpower</h2>
          <div className="flex gap-2">
            <Link href="/dashboard/daily">
              <Button
                variant="default"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Daily Report
              </Button>
            </Link>
            <Button
              onClick={() => setShowEditDialog(true)}
              variant="outline"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Phases
            </Button>
            <Button
              onClick={() => setShowProgressEditDialog(true)}
              variant="outline"
              size="sm"
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Edit Progress
            </Button>
          </div>
        </div>
        {children}
      </Card>

      {/* Phases Edit Dialog */}
      {showEditDialog && (
        <PhasesEditDialog
          projectId={projectId}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handlePhasesUpdate}
        />
      )}

      {/* Progress Edit Dialog */}
      {showProgressEditDialog && (
        <ProgressEditDialog
          isOpen={showProgressEditDialog}
          onClose={() => setShowProgressEditDialog(false)}
          projectId={projectId}
          onUpdate={handlePhasesUpdate}
        />
      )}
    </>
  );
}