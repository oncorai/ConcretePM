"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChangeOrderDialogProps {
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeOrderDialog({ 
  projectId, 
  projectName, 
  phases,
  open, 
  onOpenChange 
}: ChangeOrderDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [changeOrders, setChangeOrders] = useState<Array<{
    subPhaseId: string;
    additionalHours: number;
    reason: string;
  }>>([{
    subPhaseId: "",
    additionalHours: 0,
    reason: ""
  }]);

  const handleAddChangeOrder = () => {
    setChangeOrders([...changeOrders, {
      subPhaseId: "",
      additionalHours: 0,
      reason: ""
    }]);
  };

  const handleRemoveChangeOrder = (index: number) => {
    setChangeOrders(changeOrders.filter((_, i) => i !== index));
  };

  const handleChangeOrderUpdate = (index: number, field: string, value: any) => {
    const updated = [...changeOrders];
    updated[index] = { ...updated[index], [field]: value };
    setChangeOrders(updated);
  };

  const handleSubmit = async () => {
    // Filter out empty entries
    const validChangeOrders = changeOrders.filter(co => 
      co.subPhaseId && co.additionalHours > 0 && co.reason
    );

    if (validChangeOrders.length === 0) {
      alert("Please fill in at least one change order");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/change-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeOrders: validChangeOrders }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit change order");
      }

      // Close dialog and refresh the page
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error submitting change order:", error);
      alert("Failed to submit change order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="relative bg-background border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-lg">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Add Change Order</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add additional hours to tasks due to change orders
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Change orders will add to the budget hours for the selected tasks. 
                This helps track scope changes separately from original estimates.
              </p>
            </div>

          {changeOrders.map((changeOrder, index) => (
            <div key={index} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Change Order {index + 1}</h4>
                {changeOrders.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveChangeOrder(index)}
                    className="text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                <div>
                  <Label htmlFor={`subphase-${index}`}>Task/Subphase</Label>
                  <select
                    id={`subphase-${index}`}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    value={changeOrder.subPhaseId}
                    onChange={(e) => handleChangeOrderUpdate(index, "subPhaseId", e.target.value)}
                  >
                    <option value="">Select a task...</option>
                    {phases.map(phase => (
                      <optgroup key={phase.id} label={phase.name}>
                        {phase.subPhases.map(subPhase => (
                          <option key={subPhase.id} value={subPhase.id}>
                            {subPhase.name} (Current: {subPhase.budgetHours} hrs)
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor={`hours-${index}`}>Additional Hours</Label>
                  <Input
                    id={`hours-${index}`}
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={changeOrder.additionalHours || ""}
                    onChange={(e) => handleChangeOrderUpdate(index, "additionalHours", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor={`reason-${index}`}>Reason for Change</Label>
                  <textarea
                    id={`reason-${index}`}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md min-h-[80px]"
                    placeholder="Describe the reason for this change order..."
                    rows={2}
                    value={changeOrder.reason}
                    onChange={(e) => handleChangeOrderUpdate(index, "reason", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddChangeOrder}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Change Order
            </Button>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Change Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}