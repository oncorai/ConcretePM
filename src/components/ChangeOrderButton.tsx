"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileEdit } from "lucide-react";
import { ChangeOrderDialog } from "./ChangeOrderDialog";

interface ChangeOrderButtonProps {
  projectId: string;
  projectName: string;
  phases: Array<{
    id: string;
    name: string;
    subPhases: Array<{
      id: string;
      name: string;
      budgetHours: number;
    }>;
  }>;
}

export function ChangeOrderButton({ projectId, projectName, phases }: ChangeOrderButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setDialogOpen(true)}
        className="gap-2"
      >
        <FileEdit className="h-4 w-4" />
        Change Order
      </Button>
      
      <ChangeOrderDialog
        projectId={projectId}
        projectName={projectName}
        phases={phases}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}