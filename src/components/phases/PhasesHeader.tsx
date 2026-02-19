"use client";

import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface PhasesHeaderProps {
  onEditClick: () => void;
}

export function PhasesHeader({ onEditClick }: PhasesHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-700 flex items-center justify-between">
      <h2 className="text-lg font-semibold">Phases & Production Analysis</h2>
      <Button
        onClick={onEditClick}
        variant="outline"
        size="sm"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Phases
      </Button>
    </div>
  );
}