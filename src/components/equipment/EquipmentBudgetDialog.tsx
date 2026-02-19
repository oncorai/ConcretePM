"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, DollarSign } from "lucide-react";

interface BudgetItem {
  type: string;
  budget: number;
}

interface EquipmentBudgetDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBudgets: Record<string, number>;
  onSave: (budgets: Record<string, number>) => void;
}

export function EquipmentBudgetDialog({
  projectId,
  open,
  onOpenChange,
  currentBudgets,
  onSave
}: EquipmentBudgetDialogProps) {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [newType, setNewType] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Convert current budgets to array format
    const budgetArray = Object.entries(currentBudgets).map(([type, budget]) => ({
      type,
      budget
    }));
    setBudgets(budgetArray);
  }, [currentBudgets]);

  const handleAddType = () => {
    if (newType && newBudget) {
      // Check if type already exists
      if (budgets.find(b => b.type === newType)) {
        alert("Equipment type already exists!");
        return;
      }
      
      setBudgets([...budgets, { type: newType, budget: parseFloat(newBudget) }]);
      setNewType("");
      setNewBudget("");
    }
  };

  const handleUpdateBudget = (index: number, value: string) => {
    const updated = [...budgets];
    // Allow empty string while typing
    if (value === '') {
      updated[index].budget = 0;
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        updated[index].budget = numValue;
      }
    }
    setBudgets(updated);
  };

  const handleUpdateType = (index: number, newType: string) => {
    const updated = [...budgets];
    updated[index].type = newType;
    setBudgets(updated);
  };

  const handleRemoveType = (index: number) => {
    const updated = budgets.filter((_, i) => i !== index);
    setBudgets(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Convert back to object format, filtering out empty types or zero budgets
    const budgetObject = budgets
      .filter(item => item.type.trim() !== '' && item.budget > 0)
      .reduce((acc, item) => {
        acc[item.type] = item.budget;
        return acc;
      }, {} as Record<string, number>);
    
    // Save to localStorage for now (you can implement API storage later)
    localStorage.setItem(`equipment-budgets-${projectId}`, JSON.stringify(budgetObject));
    
    onSave(budgetObject);
    onOpenChange(false);
    setSaving(false);
  };

  const totalBudget = budgets.reduce((sum, item) => sum + item.budget, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Manage Equipment Budgets</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Set budget limits for each equipment type to track spending against targets.
          </div>

          {/* Existing Budgets */}
          <div className="space-y-3">
            {budgets.map((item, index) => (
              <div key={index} className="border border-gray-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label>Equipment Type</Label>
                      <Input
                        value={item.type}
                        onChange={(e) => handleUpdateType(index, e.target.value)}
                        placeholder="Type name"
                      />
                    </div>
                    <div>
                      <Label>Budget Amount</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.budget || ''}
                          onChange={(e) => handleUpdateBudget(index, e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveType(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Type */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium mb-3">Add New Equipment Type</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Type name (e.g., Generators)"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <Input
                  type="number"
                  placeholder="Budget"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button onClick={handleAddType} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Budget</span>
              <span className="text-2xl font-bold">${totalBudget.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Budgets"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}