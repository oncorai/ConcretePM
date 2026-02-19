"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, DollarSign, FileText, MapPin, StickyNote } from "lucide-react";

interface EquipmentBudgetItem {
  id: string;
  costCode: string;
  equipmentType: string;
  quantity: number;
  unit: string;
  budget: number;
}

interface EquipmentManualDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  budgetItems?: EquipmentBudgetItem[];
}

export function EquipmentManualDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
  budgetItems = []
}: EquipmentManualDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "Other",
    supplier: "",
    startDate: new Date().toISOString().split('T')[0],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/equipment`, {
        method: "POST",
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
        // Reset form
        setFormData({
          name: "",
          type: "Other",
          supplier: "",
          startDate: new Date().toISOString().split('T')[0],
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
        setCostCode("");
      } else {
        alert("Failed to add equipment. Please try again.");
      }
    } catch (error) {
      console.error("Error adding equipment:", error);
      alert("Failed to add equipment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Add Equipment Manually</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Equipment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Forklift 5000"
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
              <Label htmlFor="invoiceNumber">Invoice/Contract Number</Label>
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
              <Label htmlFor="startDate">Start Date *</Label>
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
            <h3 className="text-sm font-medium">Rental Rates *</h3>
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
            <p className="text-xs text-muted-foreground">
              Tip: If 3 daily rentals cost more than weekly, the system will automatically optimize to weekly rate
            </p>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Job Site A, Warehouse B"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md text-white"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this equipment..."
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
              {saving ? "Adding..." : "Add Equipment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}