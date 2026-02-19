"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ProgressEntry {
  id: string;
  subPhaseId: string;
  subPhaseName: string;
  costCode: string;
  hoursWorked: number;
  quantityComplete: number;
  unit: string;
  date: string;
}

interface ProgressEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onUpdate: () => void;
}

export default function ProgressEditDialog({
  isOpen,
  onClose,
  projectId,
  onUpdate
}: ProgressEditDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [editedData, setEditedData] = useState<Record<string, { hoursWorked: number; quantityComplete: number }>>({});

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
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
            setProgressData(progress);
            
            // Initialize edited data
            const initialEdited: Record<string, { hoursWorked: number; quantityComplete: number }> = {};
            progress.forEach((p: ProgressEntry) => {
              initialEdited[p.id] = {
                hoursWorked: p.hoursWorked,
                quantityComplete: p.quantityComplete
              };
            });
            setEditedData(initialEdited);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching progress data:', err);
          setLoading(false);
        });
    }
  }, [isOpen, projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each edited entry
      const promises = Object.entries(editedData).map(([id, data]) => 
        fetch(`/api/projects/${projectId}/progress/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hoursWorked: parseFloat(data.hoursWorked.toString()),
            quantityComplete: parseFloat(data.quantityComplete.toString())
          })
        })
      );

      await Promise.all(promises);
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateEntry = (id: string, field: 'hoursWorked' | 'quantityComplete', value: string) => {
    setEditedData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value === '' ? 0 : parseFloat(value)
      }
    }));
  };

  if (!isOpen) return null;

  // Group by date
  const groupedByDate = progressData.reduce((acc, p) => {
    const date = new Date(p.date).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(p);
    return acc;
  }, {} as Record<string, ProgressEntry[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Edit Progress Entries</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : progressData.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No progress entries found</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([date, entries]) => (
                <div key={date} className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-300">{date}</h3>
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <div key={entry.id} className="border border-gray-700 rounded-lg p-4 space-y-3 bg-gray-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{entry.costCode} - {entry.subPhaseName}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`hours-${entry.id}`} className="text-sm text-gray-400">
                              Hours Worked
                            </Label>
                            <Input
                              id={`hours-${entry.id}`}
                              type="number"
                              step="0.5"
                              value={editedData[entry.id]?.hoursWorked || 0}
                              onChange={(e) => updateEntry(entry.id, 'hoursWorked', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`qty-${entry.id}`} className="text-sm text-gray-400">
                              Quantity Complete {entry.unit ? `(${entry.unit})` : ''}
                            </Label>
                            <Input
                              id={`qty-${entry.id}`}
                              type="number"
                              step="0.01"
                              value={editedData[entry.id]?.quantityComplete || 0}
                              onChange={(e) => updateEntry(entry.id, 'quantityComplete', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}