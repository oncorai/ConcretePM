"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, DollarSign, FileText, MapPin, StickyNote } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  type: string;
  supplier?: string;
  startDate: string;
  endDate?: string;
  rentalType: string;
  rate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  status: string;
  location?: string;
  notes?: string;
  invoiceNumber?: string;
}

interface EquipmentBudgetItem {
  id: string;
  costCode: string;
  equipmentType: string;
  quantity: number;
  unit: string;
  budget: number;
}

interface EquipmentEditDialogProps {
  projectId: string;
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  budgetItems?: EquipmentBudgetItem[];
}

export function EquipmentEditDialog({
  projectId,
  equipment,
  open,
  onOpenChange,
  onSuccess,
  budgetItems = []
}: EquipmentEditDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "Other",
    supplier: "",
    startDate: "",
    endDate: "",
    rentalType: "daily",
    rate: 0,
    weeklyRate: 0,
    monthlyRate: 0,
    status: "active",
    location: "",
    notes: "",
    invoiceNumber: ""
  });
  const [costCode, setCostCode] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (equipment) {
      // Extract cost code from equipment type if it exists
      let extractedCostCode = "";
      let equipmentType = equipment.type || "Other";
      
      if (equipment.type && equipment.type.includes('-')) {
        const parts = equipment.type.split('-');
        if (parts.length >= 2) {
          extractedCostCode = parts[0];
          equipmentType = parts.slice(1).join('-');
        }
      }
      
      setFormData({
        name: equipment.name || "",
        type: equipmentType,
        supplier: equipment.supplier || "",
        startDate: equipment.startDate ? new Date(equipment.startDate).toISOString().split('T')[0] : "",
        endDate: equipment.endDate ? new Date(equipment.endDate).toISOString().split('T')[0] : "",
        rentalType: equipment.rentalType || "daily",
        rate: equipment.rate || 0,
        weeklyRate: equipment.weeklyRate || 0,
        monthlyRate: equipment.monthlyRate || 0,
        status: equipment.status || "active",
        location: equipment.location || "",
        notes: equipment.notes || "",
        invoiceNumber: equipment.invoiceNumber || ""
      });
      setCostCode(extractedCostCode);
    }
  }, [equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/equipment/${equipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: costCode ? `${costCode}-${formData.type}` : formData.type,
          rate: parseFloat(formData.rate.toString()),
          weeklyRate: parseFloat(formData.weeklyRate.toString()),
          monthlyRate: parseFloat(formData.monthlyRate.toString()),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
        })
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        alert("Failed to update equipment. Please try again.");
      }
    } catch (error) {
      console.error("Error updating equipment:", error);
      alert("Failed to update equipment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Equipment Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="costCode">Cost Code Assignment</Label>
              <select
                id="costCode"
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                value={costCode}
                onChange={(e) => setCostCode(e.target.value)}
              >
                <option value="">No cost code assigned</option>
                {budgetItems.map((item) => (
                  <option key={item.id} value={item.costCode}>
                    {item.costCode} - {item.equipmentType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g., Sunbelt Rentals"
              />
            </div>

            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="e.g., INV-12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="returned">Returned</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          {formData.status === "returned" && (
            <div>
              <Label htmlFor="endDate">Return Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Rental Rates</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rate">Daily Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="weeklyRate">Weekly Rate ($)</Label>
                <Input
                  id="weeklyRate"
                  type="number"
                  step="0.01"
                  value={formData.weeklyRate}
                  onChange={(e) => setFormData({ ...formData, weeklyRate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="monthlyRate">Monthly Rate ($)</Label>
                <Input
                  id="monthlyRate"
                  type="number"
                  step="0.01"
                  value={formData.monthlyRate}
                  onChange={(e) => setFormData({ ...formData, monthlyRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Job Site A"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}