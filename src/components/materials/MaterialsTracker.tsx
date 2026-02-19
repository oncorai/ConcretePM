"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { 
  Package,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  budgetQuantity: number;
  budgetUnitCost: number;
  actualQuantity: number;
  actualUnitCost: number;
  supplier?: string;
  lastOrderDate?: Date;
  notes?: string;
}

interface MaterialsTrackerProps {
  projectId: string;
  projectName: string;
}

const MATERIAL_CATEGORIES = [
  "Concrete",
  "Steel/Rebar", 
  "Lumber",
  "Aggregate",
  "Piping",
  "Electrical",
  "Insulation",
  "Fasteners",
  "Safety",
  "Other"
];

const UNITS = [
  "cy", // cubic yards
  "tons",
  "lbs",
  "ft",
  "sf", // square feet
  "each",
  "bags",
  "gal",
  "boxes"
];

export function MaterialsTracker({ projectId, projectName }: MaterialsTrackerProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load materials from localStorage
  useEffect(() => {
    const loadMaterials = () => {
      const key = `materials_${projectId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMaterials(parsed.map((m: any) => ({
          ...m,
          lastOrderDate: m.lastOrderDate ? new Date(m.lastOrderDate) : undefined
        })));
      }
      setLoading(false);
    };

    loadMaterials();
  }, [projectId]);

  // Save materials to localStorage
  const saveMaterials = (updatedMaterials: Material[]) => {
    const key = `materials_${projectId}`;
    localStorage.setItem(key, JSON.stringify(updatedMaterials));
    setMaterials(updatedMaterials);
  };

  // Add new material
  const addMaterial = (material: Omit<Material, 'id'>) => {
    const newMaterial: Material = {
      ...material,
      id: Date.now().toString()
    };
    saveMaterials([...materials, newMaterial]);
    setShowAddForm(false);
  };

  // Update material
  const updateMaterial = (id: string, updates: Partial<Material>) => {
    const updated = materials.map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    saveMaterials(updated);
    setEditingId(null);
  };

  // Delete material
  const deleteMaterial = (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      saveMaterials(materials.filter(m => m.id !== id));
    }
  };

  // Calculate totals
  const totals = materials.reduce((acc, material) => {
    const budgetTotal = material.budgetQuantity * material.budgetUnitCost;
    const actualTotal = material.actualQuantity * material.actualUnitCost;
    
    acc.budgetCost += budgetTotal;
    acc.actualCost += actualTotal;
    acc.variance += actualTotal - budgetTotal;
    
    return acc;
  }, { budgetCost: 0, actualCost: 0, variance: 0 });

  const variancePercent = totals.budgetCost > 0 
    ? (totals.variance / totals.budgetCost) * 100 
    : 0;

  // Group materials by category
  const materialsByCategory = materials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  if (loading) {
    return (
      <Card className="mb-8">
        <div className="p-6">
          <div className="text-center text-muted-foreground">Loading materials...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materials Tracker
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track material costs and usage against budget
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 grid gap-4 md:grid-cols-4 border-b border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Budget Total</p>
          <p className="text-2xl font-bold">${totals.budgetCost.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Actual Spent</p>
          <p className="text-2xl font-bold">${totals.actualCost.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Variance</p>
          <p className={`text-2xl font-bold ${
            totals.variance > 0 ? 'text-red-500' : 'text-green-500'
          }`}>
            {totals.variance >= 0 ? '+' : ''}${Math.abs(totals.variance).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">% of Budget</p>
          <p className={`text-2xl font-bold ${
            variancePercent > 5 ? 'text-red-500' : 
            variancePercent < -5 ? 'text-green-500' : 
            'text-yellow-500'
          }`}>
            {totals.budgetCost > 0 ? (totals.actualCost / totals.budgetCost * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Add Material Form */}
      {showAddForm && (
        <div className="p-6 border-b border-border bg-muted/20">
          <MaterialForm
            onSubmit={addMaterial}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Materials List by Category */}
      <div className="p-6">
        {Object.keys(materialsByCategory).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No materials added yet. Click "Add Material" to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => {
              const categoryTotals = categoryMaterials.reduce((acc, m) => {
                acc.budget += m.budgetQuantity * m.budgetUnitCost;
                acc.actual += m.actualQuantity * m.actualUnitCost;
                return acc;
              }, { budget: 0, actual: 0 });

              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">{category}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Budget: ${categoryTotals.budget.toLocaleString()}
                      </span>
                      <span className={`font-medium ${
                        categoryTotals.actual > categoryTotals.budget ? 'text-red-500' : 'text-green-500'
                      }`}>
                        Actual: ${categoryTotals.actual.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Material</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Budget</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actual</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Unit Cost</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Total Cost</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Variance</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {categoryMaterials.map((material) => {
                          const budgetTotal = material.budgetQuantity * material.budgetUnitCost;
                          const actualTotal = material.actualQuantity * material.actualUnitCost;
                          const variance = actualTotal - budgetTotal;
                          const variancePercent = budgetTotal > 0 ? (variance / budgetTotal) * 100 : 0;

                          if (editingId === material.id) {
                            return (
                              <tr key={material.id}>
                                <td colSpan={7} className="p-4">
                                  <MaterialForm
                                    material={material}
                                    onSubmit={(updates) => updateMaterial(material.id, updates)}
                                    onCancel={() => setEditingId(null)}
                                  />
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={material.id}>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{material.name}</p>
                                  {material.supplier && (
                                    <p className="text-xs text-muted-foreground">{material.supplier}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {material.budgetQuantity} {material.unit}
                              </td>
                              <td className="px-4 py-3">
                                <div className={material.actualQuantity > material.budgetQuantity ? 'text-yellow-500' : ''}>
                                  {material.actualQuantity} {material.unit}
                                  {material.actualQuantity > 0 && (
                                    <span className="text-xs text-muted-foreground block">
                                      {((material.actualQuantity / material.budgetQuantity) * 100).toFixed(0)}% used
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <span className="text-xs text-muted-foreground">B:</span> ${material.budgetUnitCost.toFixed(2)}
                                  <br />
                                  <span className="text-xs text-muted-foreground">A:</span> ${material.actualUnitCost.toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <span className="text-xs text-muted-foreground">B:</span> ${budgetTotal.toLocaleString()}
                                  <br />
                                  <span className="text-xs text-muted-foreground">A:</span> ${actualTotal.toLocaleString()}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className={`font-medium ${
                                  variance > 0 ? 'text-red-500' : 'text-green-500'
                                }`}>
                                  {variance >= 0 ? '+' : ''}${Math.abs(variance).toFixed(0)}
                                  <span className="text-xs block">
                                    {variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setEditingId(material.id)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => deleteMaterial(material.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

// Material Form Component
function MaterialForm({
  material,
  onSubmit,
  onCancel
}: {
  material?: Material;
  onSubmit: (material: Omit<Material, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: material?.name || '',
    category: material?.category || MATERIAL_CATEGORIES[0],
    unit: material?.unit || UNITS[0],
    budgetQuantity: material?.budgetQuantity || 0,
    budgetUnitCost: material?.budgetUnitCost || 0,
    actualQuantity: material?.actualQuantity || 0,
    actualUnitCost: material?.actualUnitCost || 0,
    supplier: material?.supplier || '',
    notes: material?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Material Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Portland Cement"
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Category *</label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {MATERIAL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Unit *</label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            {UNITS.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Budget Quantity *</label>
          <Input
            type="number"
            step="0.01"
            value={formData.budgetQuantity || ''}
            onChange={(e) => setFormData({ ...formData, budgetQuantity: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Budget Unit Cost *</label>
          <Input
            type="number"
            step="0.01"
            value={formData.budgetUnitCost || ''}
            onChange={(e) => setFormData({ ...formData, budgetUnitCost: parseFloat(e.target.value) || 0 })}
            placeholder="$ per unit"
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Actual Quantity</label>
          <Input
            type="number"
            step="0.01"
            value={formData.actualQuantity || ''}
            onChange={(e) => setFormData({ ...formData, actualQuantity: parseFloat(e.target.value) || 0 })}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Actual Unit Cost</label>
          <Input
            type="number"
            step="0.01"
            value={formData.actualUnitCost || ''}
            onChange={(e) => setFormData({ ...formData, actualUnitCost: parseFloat(e.target.value) || 0 })}
            placeholder="$ per unit"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Supplier</label>
          <Input
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            placeholder="e.g., ABC Supply Co."
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Notes</label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes..."
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          {material ? 'Update' : 'Add'} Material
        </Button>
      </div>
    </form>
  );
}