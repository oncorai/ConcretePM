"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronRight,
  Save,
  X
} from "lucide-react";

interface SubPhase {
  id?: string;
  name: string;
  budgetHours: number;
  budgetQuantity?: number | null;
  unit?: string | null;
  orderIndex: number;
}

interface Phase {
  id?: string;
  name: string;
  orderIndex: number;
  subPhases: SubPhase[];
  isExpanded?: boolean;
}

interface PhasesEditDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PhasesEditDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess
}: PhasesEditDialogProps) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadPhases();
    }
  }, [open, projectId]);

  const loadPhases = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases`);
      if (response.ok) {
        const data = await response.json();
        setPhases(data.map((phase: any) => ({
          ...phase,
          isExpanded: false,
          subPhases: phase.subPhases || []
        })));
      }
    } catch (error) {
      console.error("Error loading phases:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPhase = () => {
    const newPhase: Phase = {
      name: "",
      orderIndex: phases.length,
      subPhases: [{
        name: "",
        budgetHours: 0,
        budgetQuantity: null,
        unit: "ft",
        orderIndex: 0
      }],
      isExpanded: true
    };
    setPhases([...phases, newPhase]);
  };

  const removePhase = (index: number) => {
    if (confirm("Are you sure you want to delete this phase and all its subphases?")) {
      setPhases(phases.filter((_, i) => i !== index));
    }
  };

  const updatePhase = (index: number, updates: Partial<Phase>) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], ...updates };
    setPhases(newPhases);
  };

  const togglePhaseExpansion = (index: number) => {
    const newPhases = [...phases];
    newPhases[index].isExpanded = !newPhases[index].isExpanded;
    setPhases(newPhases);
  };

  const addSubPhase = (phaseIndex: number) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].subPhases.push({
      name: "",
      budgetHours: 0,
      budgetQuantity: null,
      unit: "ft",
      orderIndex: newPhases[phaseIndex].subPhases.length
    });
    setPhases(newPhases);
  };

  const removeSubPhase = (phaseIndex: number, subPhaseIndex: number) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].subPhases = newPhases[phaseIndex].subPhases.filter((_, i) => i !== subPhaseIndex);
    setPhases(newPhases);
  };

  const updateSubPhase = (phaseIndex: number, subPhaseIndex: number, updates: Partial<SubPhase>) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].subPhases[subPhaseIndex] = {
      ...newPhases[phaseIndex].subPhases[subPhaseIndex],
      ...updates
    };
    setPhases(newPhases);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update order indices
      const phasesWithOrder = phases.map((phase, index) => ({
        ...phase,
        orderIndex: index,
        subPhases: phase.subPhases.map((sp, spIndex) => ({
          ...sp,
          orderIndex: spIndex
        }))
      }));

      const response = await fetch(`/api/projects/${projectId}/phases`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phases: phasesWithOrder })
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update phases");
      }
    } catch (error) {
      console.error("Error saving phases:", error);
      alert("Failed to save phases");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <div className="text-center py-8">Loading phases...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Edit Phases & Subphases</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 py-4">
            {phases.map((phase, phaseIndex) => (
              <div key={phaseIndex} className="border border-border rounded-lg">
                {/* Phase Header */}
                <div className="bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePhaseExpansion(phaseIndex)}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      {phase.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    
                    <Input
                      value={phase.name}
                      onChange={(e) => updatePhase(phaseIndex, { name: e.target.value })}
                      placeholder={`Phase ${phaseIndex + 1} name`}
                      className="flex-1"
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePhase(phaseIndex)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Subphases */}
                {phase.isExpanded && (
                  <div className="p-3 space-y-2">
                    {phase.subPhases.map((subPhase, subPhaseIndex) => (
                      <div key={subPhaseIndex} className="flex items-center gap-2 p-2 bg-muted/50 rounded overflow-visible">
                        <GripVertical className="h-4 w-4 text-gray-500" />
                        
                        <Input
                          value={subPhase.name}
                          onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, { name: e.target.value })}
                          placeholder="Subphase name"
                          className="flex-1"
                        />
                        
                        <Input
                          type="number"
                          value={subPhase.budgetHours || ""}
                          onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, { 
                            budgetHours: parseFloat(e.target.value) || 0 
                          })}
                          placeholder="Hours"
                          className="w-24"
                        />
                        
                        <Input
                          type="number"
                          value={subPhase.budgetQuantity || ""}
                          onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, { 
                            budgetQuantity: e.target.value ? parseFloat(e.target.value) : null 
                          })}
                          placeholder="Qty"
                          className="w-20"
                        />
                        
                        <select
                          value={subPhase.unit || "ft"}
                          onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, { unit: e.target.value })}
                          className="px-2 py-1 border border-border rounded bg-background w-16 text-sm flex-shrink-0"
                        >
                          <option value="ft">ft</option>
                          <option value="cy">cy</option>
                          <option value="sf">sf</option>
                          <option value="ea">ea</option>
                          <option value="hr">hr</option>
                          <option value="wks">wks</option>
                        </select>

                        {phase.subPhases.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSubPhase(phaseIndex, subPhaseIndex)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addSubPhase(phaseIndex)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subphase
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addPhase}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Phase
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}