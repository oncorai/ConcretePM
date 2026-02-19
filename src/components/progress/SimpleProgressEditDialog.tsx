"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SimpleProgressEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onUpdate: () => void;
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

export default function SimpleProgressEditDialog({
  isOpen,
  onClose,
  projectId,
  onUpdate,
  progressData
}: SimpleProgressEditDialogProps) {
  const [loading, setLoading] = useState(true);
  const [fetchedData, setFetchedData] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && projectId) {
      // Fetch progress data when dialog opens
      fetch(`/api/projects/${projectId}`)
        .then(res => res.json())
        .then(data => {
          if (data.dailyReports) {
            const progress = data.dailyReports.flatMap((report: any) => 
              report.progress
                .filter((p: any) => p.subPhaseId && p.subPhase)
                .map((p: any) => ({
                  id: p.id,
                  subPhaseId: p.subPhaseId,
                  subPhaseName: p.subPhase?.name || '',
                  costCode: p.subPhase?.costCode || '',
                  hoursWorked: p.hoursWorked,
                  quantityComplete: p.quantityComplete || 0,
                  unit: p.subPhase?.unit || '',
                  date: report.date
                }))
            );
            setFetchedData(progress);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching progress data:', err);
          setLoading(false);
        });
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const displayData = progressData || fetchedData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Progress Entries</h2>
        
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-400">Loading progress data...</p>
          ) : displayData && displayData.length > 0 ? (
            <>
              <p className="text-gray-400">Total entries: {displayData.length}</p>
              
              <div className="space-y-2">
                {displayData.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="border border-gray-700 p-3 rounded">
                    <p className="text-sm">
                      {entry.costCode} - {entry.subPhaseName}
                    </p>
                    <p className="text-xs text-gray-400">
                      Hours: {entry.hoursWorked} | Quantity: {entry.quantityComplete} {entry.unit}
                    </p>
                  </div>
                ))}
                {displayData.length > 5 && (
                  <p className="text-sm text-gray-400">...and {displayData.length - 5} more</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-400">No progress entries found</p>
          )}
        </div>
        
        <div className="mt-6 flex gap-3">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          <Button onClick={() => {
            alert('Save functionality coming soon');
            onClose();
          }}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}