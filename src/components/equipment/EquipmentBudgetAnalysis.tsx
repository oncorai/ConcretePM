"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { 
  Wrench, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  Upload,
  FileText,
  Truck,
  Timer,
  TrendingUp,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  Trash2,
  PieChart
} from "lucide-react";
import { InvoiceUploadDialog } from "./InvoiceUploadDialog";
import { EquipmentEditDialog } from "./EquipmentEditDialog";
import { EquipmentManualDialog } from "./EquipmentManualDialog";
import { EquipmentBudgetDialog } from "./EquipmentBudgetDialog";

interface EquipmentBudgetItem {
  id: string;
  costCode: string;
  equipmentType: string;
  quantity: number;
  unit: string;
  budget: number;
}

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
  totalCost?: number;
  notes?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceUrl?: string;
}

interface EquipmentBudgetAnalysisProps {
  projectId: string;
}

// Define consistent colors for budget categories
const CATEGORY_COLORS: Record<string, string> = {
  'Forklift': '#3b82f6',           // Blue
  'Water truck': '#f59e0b',        // Yellow/Orange
  'Jumping jack': '#10b981',       // Green
  '5 yard dump truck': '#ef4444',  // Red
  'Bobcat': '#8b5cf6',             // Purple
  'Backhoe': '#06b6d4',            // Cyan
  'SOG - Pans & Blades': '#ec4899', // Pink
  'SOG - Soffcut blades': '#84cc16', // Lime
  'SOG - Roller': '#f97316',       // Orange
  'CMU wall fdn equipment': '#6366f1', // Indigo
  'Plate tamper': '#22c55e',       // Bright Green
  'Track skidsteer': '#a855f7',    // Bright Purple
  'Trash hopper': '#14b8a6',       // Teal
  'Utility vehicle': '#f43f5e',    // Rose
  'Telehandler': '#0ea5e9',        // Sky Blue
};

// Function to get color for a category
const getCategoryColor = (category: string): string => {
  if (!category) return '#6b7280';
  
  // Handle cost code prefixed equipment types (e.g., "1000-2000-Water truck")
  if (category.includes('-')) {
    const parts = category.split('-');
    if (parts.length >= 3) {
      // Join everything after the second dash as the equipment type
      const equipmentType = parts.slice(2).join('-').trim();
      // Try to match the equipment type
      for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
        if (equipmentType.toLowerCase().includes(key.toLowerCase())) {
          return color;
        }
      }
    }
  }
  
  // Try to match any part of the category string with our color keys
  const categoryLower = category.toLowerCase();
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (categoryLower.includes(key.toLowerCase())) {
      return color;
    }
  }
  
  // Special case for dump trucks
  if (categoryLower.includes('dump truck')) {
    return CATEGORY_COLORS['5 yard dump truck'];
  }
  
  // Direct match attempt
  return CATEGORY_COLORS[category] || '#6b7280'; // Default gray if not found
};

// Function to extract equipment type from a string that might have cost codes
const getEquipmentTypeFromString = (str: string): string => {
  if (!str) return '';
  
  // Check if it's in the format "XXXX-XXXX-Equipment Type"
  const match = str.match(/^\d{4}-\d{4}-(.+)$/);
  if (match) {
    return match[1].trim();
  }
  
  // Otherwise return the original string
  return str;
};

export function EquipmentBudgetAnalysis({ projectId }: EquipmentBudgetAnalysisProps) {
  const [budgetItems, setBudgetItems] = useState<EquipmentBudgetItem[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentBudgets, setEquipmentBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      // Fetch equipment budget items
      const budgetResponse = await fetch(`/api/projects/${projectId}/equipment-budget`);
      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json();
        setBudgetItems(budgetData);
        
        // Convert budget items to equipment budgets format
        const budgets: Record<string, number> = {};
        budgetData.forEach((item: EquipmentBudgetItem) => {
          budgets[item.equipmentType] = item.budget;
        });
        setEquipmentBudgets(budgets);
      }

      // Fetch actual equipment for spent calculations
      const equipmentResponse = await fetch(`/api/projects/${projectId}/equipment`);
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData);
      }
    } catch (error) {
      console.error("Error fetching equipment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (equipmentId: string) => {
    const equipmentToEdit = equipment.find(eq => eq.id === equipmentId);
    if (equipmentToEdit) {
      setEditingEquipment(equipmentToEdit);
      setShowEditDialog(true);
    }
  };

  const handleReturn = async (equipmentId: string) => {
    if (!confirm("Are you sure you want to mark this equipment as returned?")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/equipment/${equipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "returned",
          endDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        fetchData();
      } else {
        alert("Failed to return equipment. Please try again.");
      }
    } catch (error) {
      console.error("Error returning equipment:", error);
      alert("Failed to return equipment. Please try again.");
    }
  };

  const handleRemove = async (equipmentId: string) => {
    if (!confirm("Are you sure you want to remove this equipment from the history?")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/equipment/${equipmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      } else {
        alert("Failed to remove equipment. Please try again.");
      }
    } catch (error) {
      console.error("Error removing equipment:", error);
      alert("Failed to remove equipment. Please try again.");
    }
  };

  const calculateDaysRented = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const calculateTotalCost = (equipment: Equipment) => {
    const totalDays = calculateDaysRented(equipment.startDate, equipment.endDate);
    const dailyRate = equipment.rate || 0;
    const weeklyRate = equipment.weeklyRate || dailyRate * 7;
    const monthlyRate = equipment.monthlyRate || dailyRate * 28;
    
    let totalCost = 0;
    let remainingDays = totalDays;
    
    if (remainingDays >= 28) {
      const months = Math.floor(remainingDays / 28);
      totalCost += months * monthlyRate;
      remainingDays = remainingDays % 28;
    }
    
    if (remainingDays >= 21) {
      totalCost += monthlyRate;
      remainingDays = 0;
    } else if (remainingDays >= 7) {
      const weeks = Math.floor(remainingDays / 7);
      totalCost += weeks * weeklyRate;
      remainingDays = remainingDays % 7;
      
      if (remainingDays >= 3 && dailyRate * 3 >= weeklyRate) {
        totalCost += weeklyRate;
        remainingDays = 0;
      }
    } else if (remainingDays >= 3 && dailyRate * 3 >= weeklyRate) {
      totalCost += weeklyRate;
      remainingDays = 0;
    }
    
    if (remainingDays > 0) {
      totalCost += remainingDays * dailyRate;
    }
    
    return totalCost;
  };

  // Calculate spent for each budget item
  const calculateSpentForBudgetItem = (item: EquipmentBudgetItem) => {
    // Match by cost code first, then by equipment type
    return equipment
      .filter(eq => {
        // Try to match by cost code in equipment name or type
        const costCodeMatch = eq.name.includes(item.costCode) || eq.type?.includes(item.costCode);
        // Or match by equipment type
        const typeMatch = eq.name.toLowerCase().includes(item.equipmentType.toLowerCase());
        return costCodeMatch || typeMatch;
      })
      .reduce((sum, eq) => sum + calculateTotalCost(eq), 0);
  };

  // Calculate totals
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = equipment.reduce((sum, eq) => sum + calculateTotalCost(eq), 0);

  // Calculate active equipment count for each budget item
  const getActiveCountForBudgetItem = (item: EquipmentBudgetItem) => {
    return equipment.filter(eq => {
      const costCodeMatch = eq.name.includes(item.costCode) || eq.type?.includes(item.costCode);
      const typeMatch = eq.name.toLowerCase().includes(item.equipmentType.toLowerCase());
      return (costCodeMatch || typeMatch) && eq.status === "active";
    }).length;
  };
  
  // Find the budget item that matches this equipment
  const findBudgetItemForEquipment = (eq: Equipment): EquipmentBudgetItem | null => {
    // First try to match by cost code
    for (const item of budgetItems) {
      if (eq.name.includes(item.costCode) || eq.type?.includes(item.costCode)) {
        return item;
      }
    }
    
    // Then try to match by equipment type
    for (const item of budgetItems) {
      if (eq.name.toLowerCase().includes(item.equipmentType.toLowerCase())) {
        return item;
      }
    }
    
    return null;
  };

  const getCurrentStatus = (startDate: string, daysRented: number) => {
    if (daysRented <= 7) {
      return `Day ${daysRented}`;
    } else if (daysRented <= 28) {
      const weeks = Math.floor(daysRented / 7);
      const days = daysRented % 7;
      if (days === 0) {
        return `Week ${weeks}`;
      } else {
        return `Week ${weeks} + ${days} day${days > 1 ? 's' : ''}`;
      }
    } else {
      const months = Math.floor(daysRented / 28);
      const remainingDays = daysRented % 28;
      if (remainingDays === 0) {
        return `Month ${months}`;
      } else if (remainingDays <= 7) {
        return `Month ${months} + ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
      } else {
        const weeks = Math.floor(remainingDays / 7);
        const days = remainingDays % 7;
        return `Month ${months} + ${weeks}w${days > 0 ? ` ${days}d` : ''}`;
      }
    }
  };

  const getReturnDates = (startDate: string, equipment: Equipment) => {
    const start = new Date(startDate);
    const today = new Date();
    const daysRented = calculateDaysRented(startDate);
    
    let weeklyReturn = new Date(start);
    let monthlyReturn = new Date(start);
    
    const currentWeek = Math.ceil(daysRented / 7);
    weeklyReturn.setDate(start.getDate() + (currentWeek * 7));
    
    if (daysRented <= 28) {
      monthlyReturn.setDate(start.getDate() + 28);
    } else {
      const currentMonth = Math.ceil(daysRented / 28);
      monthlyReturn.setDate(start.getDate() + (currentMonth * 28));
    }
    
    return {
      weekly: weeklyReturn,
      monthly: monthlyReturn
    };
  };

  const getDaysUntilDate = (targetDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil <= 0) return { text: "TODAY", class: "bg-red-500 text-white" };
    if (daysUntil === 1) return { text: "TOMORROW", class: "bg-orange-500 text-white" };
    if (daysUntil > 1) return { text: `${daysUntil} DAYS`, class: "bg-gray-500 text-white" };
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Track equipment costs against budget allocations
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowBudgetDialog(true)} size="sm" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Edit Budgets
              </Button>
              <Button onClick={() => setShowManualDialog(true)} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Manual
              </Button>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Invoice
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-b border-border">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Truck className="h-4 w-4" />
              Active Rentals
            </div>
            <div className="text-2xl font-bold">
              {equipment.filter(e => e.status === "active").length}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Total Spent to Date
            </div>
            <div className="text-2xl font-bold">
              ${totalSpent.toLocaleString()}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 min-h-[260px] flex flex-col md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <PieChart className="h-4 w-4" />
              Cost Breakdown
            </div>
            {equipment.length > 0 && totalSpent > 0 ? (
              <div className="mt-3 flex items-center gap-6 flex-1">
                {(() => {
                  // Calculate cost breakdown by budget category
                  const costBreakdown: Record<string, { cost: number; percentage: number }> = {};
                  
                  // Initialize with all budget items
                  budgetItems.forEach(item => {
                    costBreakdown[item.equipmentType] = { cost: 0, percentage: 0 };
                  });
                  
                  // Calculate actual costs for each budget category
                  budgetItems.forEach(item => {
                    const spent = calculateSpentForBudgetItem(item);
                    if (spent > 0) {
                      costBreakdown[item.equipmentType].cost = spent;
                      costBreakdown[item.equipmentType].percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
                    }
                  });
                  
                  // Sort by cost descending and filter out zero values
                  const topCategories = Object.entries(costBreakdown)
                    .filter(([, data]) => data.cost > 0)
                    .sort(([, a], [, b]) => b.cost - a.cost)
                    .slice(0, 6);
                  
                  return (
                    <>
                      {/* SVG Pie Chart - Made bigger */}
                      <svg width="180" height="180" viewBox="0 0 100 100" className="flex-shrink-0">
                        {(() => {
                          let cumulativePercentage = 0;
                          return topCategories.map(([name, data], index) => {
                            const startAngle = cumulativePercentage * 3.6 - 90;
                            cumulativePercentage += data.percentage;
                            const endAngle = cumulativePercentage * 3.6 - 90;
                            
                            const largeArcFlag = data.percentage > 50 ? 1 : 0;
                            
                            const x1 = 50 + 45 * Math.cos((startAngle * Math.PI) / 180);
                            const y1 = 50 + 45 * Math.sin((startAngle * Math.PI) / 180);
                            const x2 = 50 + 45 * Math.cos((endAngle * Math.PI) / 180);
                            const y2 = 50 + 45 * Math.sin((endAngle * Math.PI) / 180);
                            
                            // Handle edge case for 100% single item
                            if (data.percentage >= 99.9) {
                              return (
                                <circle
                                  key={name}
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill={getCategoryColor(name)}
                                  stroke="white"
                                  strokeWidth="1"
                                />
                              );
                            }
                            
                            return (
                              <path
                                key={name}
                                d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                fill={getCategoryColor(name)}
                                stroke="white"
                                strokeWidth="1"
                              />
                            );
                          });
                        })()}
                      </svg>
                      
                      {/* Legend */}
                      <div className="flex-1 space-y-1 text-xs">
                        {topCategories.map(([name, data], index) => (
                          <div key={name} className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: getCategoryColor(name) }}
                            />
                            <span className="flex-1 truncate" title={name}>
                              {name}
                            </span>
                            <span className="font-medium flex-shrink-0">{data.percentage.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                No equipment costs yet
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Cost Code
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Equipment Type
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Unit
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Budget
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Spent to Date
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Variance
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    % Complete
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Projected Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.map((item) => {
                  const spent = calculateSpentForBudgetItem(item);
                  const variance = spent - item.budget;
                  const percentComplete = item.budget > 0 ? (spent / item.budget) * 100 : 0;
                  const activeCount = getActiveCountForBudgetItem(item);
                  const projectedTotal = activeCount > 0 ? spent * 1.2 : spent;

                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">{item.costCode}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <div 
                            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" 
                            style={{ backgroundColor: getCategoryColor(item.equipmentType) }}
                          />
                          <div>
                            <div className="font-medium">{item.equipmentType}</div>
                            {activeCount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {activeCount} active
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4">{item.unit}</td>
                      <td className="py-3 px-4 text-right">${item.budget.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">${spent.toFixed(0)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        variance > 0 ? 'text-red-500' : variance < 0 ? 'text-green-500' : ''
                      }`}>
                        {variance > 0 ? '-' : '+'}${Math.abs(variance).toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                percentComplete > 100 ? 'bg-red-500' : 
                                percentComplete > 80 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(percentComplete, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{percentComplete.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        projectedTotal > item.budget ? 'text-red-500' : 'text-green-500'
                      }`}>
                        ${projectedTotal.toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Total Row */}
                <tr className="font-semibold bg-muted/30">
                  <td colSpan={4} className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right">${totalBudget.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">${totalSpent.toFixed(0)}</td>
                  <td className={`py-3 px-4 text-right ${
                    totalSpent > totalBudget ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {totalSpent > totalBudget ? '-' : '+'}${Math.abs(totalSpent - totalBudget).toFixed(0)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%
                  </td>
                  <td className="py-3 px-4 text-right">
                    ${(totalSpent * 1.2).toFixed(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Equipment Rental Optimization Tracker */}
          <div className="mt-8">
            <h3 className="font-medium text-lg mb-4">Rental Optimizer</h3>
            {equipment.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No equipment tracked yet. Upload an invoice to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Equipment</th>
                      <th className="text-left py-3 px-4 font-medium">Start Date</th>
                      <th className="text-left py-3 px-4 font-medium">Current Status</th>
                      <th className="text-left py-3 px-4 font-medium">Weekly Return</th>
                      <th className="text-left py-3 px-4 font-medium">Monthly Return</th>
                      <th className="text-left py-3 px-4 font-medium whitespace-nowrap">
                        <div>Total Spent</div>
                        <div className="text-xs font-normal">to Date</div>
                      </th>
                      <th className="text-center py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.filter(eq => eq.status === "active").map((eq) => {
                      const daysRented = calculateDaysRented(eq.startDate);
                      const returnDates = getReturnDates(eq.startDate, eq);
                      const daysUntilWeekly = getDaysUntilDate(returnDates.weekly);
                      const daysUntilMonthly = getDaysUntilDate(returnDates.monthly);
                      const totalCost = calculateTotalCost(eq);
                      
                      return (
                        <tr key={eq.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2">
                              <div 
                                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" 
                                style={{ backgroundColor: (() => {
                                  const budgetItem = findBudgetItemForEquipment(eq);
                                  return budgetItem ? getCategoryColor(budgetItem.equipmentType) : '#6b7280';
                                })() }}
                              />
                              <div>
                                <div className="font-medium">{eq.name || 'Unknown Equipment'}</div>
                                {eq.supplier && (
                                  <div className="text-xs text-muted-foreground">{eq.supplier}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(eq.startDate).toLocaleDateString('en-US', { 
                              month: 'numeric', 
                              day: 'numeric', 
                              year: '2-digit' 
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">
                              {getCurrentStatus(eq.startDate, daysRented)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${eq.rate}/day
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <div>
                                  {returnDates.weekly.toLocaleDateString('en-US', { 
                                    month: 'numeric', 
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ${eq.weeklyRate || eq.rate * 7}/wk
                                </div>
                              </div>
                              {(() => {
                                const badge = getUrgencyBadge(daysUntilWeekly);
                                return badge ? (
                                  <Badge className={`${badge.class} text-xs px-2 py-0.5`}>
                                    {badge.text}
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <div>
                                  {returnDates.monthly.toLocaleDateString('en-US', { 
                                    month: 'numeric', 
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ${eq.monthlyRate || eq.rate * 28}/mo
                                </div>
                              </div>
                              {(() => {
                                const badge = getUrgencyBadge(daysUntilMonthly);
                                return badge ? (
                                  <Badge className={`${badge.class} text-xs px-2 py-0.5`}>
                                    {badge.text}
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">
                              ${totalCost.toFixed(0)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEdit(eq.id)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleReturn(eq.id)}
                              >
                                Return
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Returned Equipment Section */}
            {equipment.filter(eq => eq.status === "returned").length > 0 && (
              <div className="mt-8">
                <h4 className="font-medium mb-3 text-muted-foreground">Returned Equipment</h4>
                <div className="space-y-2">
                  {equipment.filter(eq => eq.status === "returned").map((eq) => {
                    const daysRented = calculateDaysRented(eq.startDate, eq.endDate);
                    const totalCost = calculateTotalCost(eq);
                    
                    return (
                      <div key={eq.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: (() => {
                              const budgetItem = findBudgetItemForEquipment(eq);
                              return budgetItem ? getCategoryColor(budgetItem.equipmentType) : '#6b7280';
                            })() }}
                          />
                          <div>
                            <div className="font-medium">{eq.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(eq.startDate).toLocaleDateString()} - {eq.endDate && new Date(eq.endDate).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                            {daysRented} days
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">${totalCost.toFixed(0)}</div>
                            <div className="text-xs text-muted-foreground">
                              ${eq.rate}/day
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(eq.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {showAddDialog && (
        <InvoiceUploadDialog
          projectId={projectId}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          budgetItems={budgetItems}
          onSuccess={() => {
            fetchData();
            setShowAddDialog(false);
          }}
        />
      )}

      {showEditDialog && editingEquipment && (
        <EquipmentEditDialog
          projectId={projectId}
          equipment={editingEquipment}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          budgetItems={budgetItems}
          onSuccess={() => {
            fetchData();
            setShowEditDialog(false);
            setEditingEquipment(null);
          }}
        />
      )}

      {showManualDialog && (
        <EquipmentManualDialog
          projectId={projectId}
          open={showManualDialog}
          onOpenChange={setShowManualDialog}
          budgetItems={budgetItems}
          onSuccess={() => {
            fetchData();
            setShowManualDialog(false);
          }}
        />
      )}

      {showBudgetDialog && (
        <EquipmentBudgetDialog
          projectId={projectId}
          open={showBudgetDialog}
          onOpenChange={setShowBudgetDialog}
          currentBudgets={equipmentBudgets}
          onSave={(budgets) => {
            // TODO: Save budgets to equipment budget items
            setEquipmentBudgets(budgets);
            setShowBudgetDialog(false);
          }}
        />
      )}
    </>
  );
}