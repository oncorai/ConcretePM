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

interface EquipmentOptimizerProps {
  projectId: string;
  projectName: string;
}

export function EquipmentOptimizer({ projectId, projectName }: EquipmentOptimizerProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentBudgets, setEquipmentBudgets] = useState<Record<string, number>>({
    "Heavy Equipment": 50000,
    "Tools": 10000,
    "Vehicles": 30000,
    "Scaffolding": 15000,
    "Safety Equipment": 5000,
    "Lifting Equipment": 25000,
    "Other": 10000
  });

  useEffect(() => {
    fetchEquipment();
    // Load saved budgets from localStorage
    const savedBudgets = localStorage.getItem(`equipment-budgets-${projectId}`);
    if (savedBudgets) {
      setEquipmentBudgets(JSON.parse(savedBudgets));
    }
  }, [projectId]);

  const fetchEquipment = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/equipment`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (equipmentId: string) => {
    // Find the equipment to edit
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
      const equipment = await fetch(`/api/projects/${projectId}/equipment/${equipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "returned",
          endDate: new Date().toISOString()
        })
      });

      if (equipment.ok) {
        fetchEquipment();
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
        fetchEquipment();
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
    
    // Set times to midnight to avoid partial day issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because rental starts on day 1
    return diffDays;
  };

  const getCurrentStatus = (startDate: string, daysRented: number) => {
    // Simplified status based on actual billing
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
    
    // Determine current and next return dates
    let weeklyReturn = new Date(start);
    let monthlyReturn = new Date(start);
    
    // Weekly return dates are every 7 days (6/23, 6/30, 7/7, etc.)
    const currentWeek = Math.ceil(daysRented / 7);
    weeklyReturn.setDate(start.getDate() + (currentWeek * 7));
    
    // Monthly return date is 28 days (4 weeks) from start
    if (daysRented <= 28) {
      monthlyReturn.setDate(start.getDate() + 28);
    } else {
      // If past first month, show next month end
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

  const calculateOptimalCost = (equipment: Equipment, days: number) => {
    const dailyCost = days * equipment.rate;
    const weeklyCost = Math.ceil(days / 7) * (equipment.weeklyRate || equipment.rate * 5);
    const monthlyCost = Math.ceil(days / 30) * (equipment.monthlyRate || equipment.rate * 20);
    
    return Math.min(dailyCost, weeklyCost, monthlyCost);
  };

  const calculateTotalCost = (equipment: Equipment) => {
    const totalDays = calculateDaysRented(equipment.startDate, equipment.endDate);
    
    // Get rates with fallbacks
    const dailyRate = equipment.rate || 0;
    const weeklyRate = equipment.weeklyRate || dailyRate * 7;
    const monthlyRate = equipment.monthlyRate || dailyRate * 28;
    
    let totalCost = 0;
    let remainingDays = totalDays;
    
    // Calculate based on actual billing cycles with hierarchy
    // First, calculate full months (28 days each)
    if (remainingDays >= 28) {
      const months = Math.floor(remainingDays / 28);
      totalCost += months * monthlyRate;
      remainingDays = remainingDays % 28;
    }
    
    // Check if remaining days should trigger monthly rate (21+ days = 3 weeks)
    if (remainingDays >= 21) {
      // 3+ weeks triggers monthly rate for the entire remaining period
      totalCost += monthlyRate;
      remainingDays = 0;
    } else if (remainingDays >= 7) {
      // Calculate full weeks (7 days each)
      const weeks = Math.floor(remainingDays / 7);
      totalCost += weeks * weeklyRate;
      remainingDays = remainingDays % 7;
      
      // Check if remaining days should trigger weekly rate (3+ days)
      if (remainingDays >= 3 && dailyRate * 3 >= weeklyRate) {
        totalCost += weeklyRate;
        remainingDays = 0;
      }
    } else if (remainingDays >= 3 && dailyRate * 3 >= weeklyRate) {
      // 3+ days triggers weekly rate
      totalCost += weeklyRate;
      remainingDays = 0;
    }
    
    // Add any remaining daily charges (only if less than 3 days or daily is cheaper)
    if (remainingDays > 0) {
      totalCost += remainingDays * dailyRate;
    }
    
    return totalCost;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Scheduled</Badge>;
      case "returned":
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Returned</Badge>;
      case "extended":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Extended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };


  const totalSpent = equipment.reduce((sum, eq) => sum + calculateTotalCost(eq), 0);
  
  // Calculate cost breakdown by equipment
  const costBreakdown = equipment.reduce((acc, eq) => {
    const cost = calculateTotalCost(eq);
    if (!acc[eq.name]) {
      acc[eq.name] = { cost: 0, percentage: 0 };
    }
    acc[eq.name].cost += cost;
    return acc;
  }, {} as Record<string, { cost: number; percentage: number }>);
  
  // Calculate percentages
  Object.keys(costBreakdown).forEach(key => {
    costBreakdown[key].percentage = totalSpent > 0 ? (costBreakdown[key].cost / totalSpent) * 100 : 0;
  });
  
  // Sort by cost descending and get top 5
  const topEquipment = Object.entries(costBreakdown)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .slice(0, 5);
  
  // Calculate "Other" category if there are more than 5 items
  const otherCost = Object.entries(costBreakdown)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .slice(5)
    .reduce((sum, [, data]) => sum + data.cost, 0);
  
  if (otherCost > 0) {
    topEquipment.push(['Other', { cost: otherCost, percentage: (otherCost / totalSpent) * 100 }]);
  }
  
  // Colors for pie chart segments and equipment categories
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
  
  // Create a color mapping for equipment types based on their cost ranking
  const equipmentColorMap: Record<string, string> = {};
  topEquipment.forEach(([name], index) => {
    equipmentColorMap[name] = pieColors[index % pieColors.length];
  });
  
  // Create budget type colors (stable mapping)
  const budgetTypeColors: Record<string, string> = {
    'Excavation': '#3b82f6',
    'Forklift': '#10b981', 
    'Water Truck': '#f59e0b',
    'Skidsteer': '#ef4444',
    'Dump Truck': '#8b5cf6',
    'Trash': '#6b7280',
    'Heavy Equipment': '#ec4899',
    'Tools': '#14b8a6',
    'Vehicles': '#f97316',
    'Scaffolding': '#a855f7',
    'Safety Equipment': '#06b6d4',
    'Lifting Equipment': '#84cc16',
    'Other': '#64748b'
  };
  
  // Function to match equipment to budget categories - more careful matching
  const matchEquipmentToCategory = (equipmentName: string, equipmentType: string): string | null => {
    const name = equipmentName.toLowerCase();
    
    // Define specific matching rules for better accuracy
    // These are checked first and take priority
    const specificMatches: Record<string, string[]> = {
      "Water Truck": ["water truck"],
      "Skidsteer": ["skidsteer", "skid steer"],
      "Forklift": ["forklift", "telehandler", "reach forklift"],
      "Excavator": ["excavator"],
      "Dozer": ["dozer", "bulldozer"],
      "Dump Truck": ["dump truck"],
      "Trash": ["trash hopper", "dumpster", "waste"],
    };
    
    // Check specific matches first (in order of priority)
    for (const [budgetType, keywords] of Object.entries(specificMatches)) {
      if (equipmentBudgets[budgetType] !== undefined) {
        for (const keyword of keywords) {
          if (name.includes(keyword)) {
            return budgetType;
          }
        }
      }
    }
    
    // Then check for exact budget category name matches
    // But be careful with generic terms like "truck"
    for (const [budgetType, budget] of Object.entries(equipmentBudgets)) {
      const budgetKey = budgetType.toLowerCase();
      
      // Skip compound terms that we've already handled specifically
      if (specificMatches[budgetType]) continue;
      
      // Skip generic terms that might cause false matches
      const genericTerms = ["truck", "equipment", "tool", "machine"];
      if (genericTerms.includes(budgetKey)) continue;
      
      // Check if the full budget category name appears in equipment name
      if (name.includes(budgetKey)) {
        return budgetType;
      }
    }
    
    // If no exact match, default to "Excavation" if it exists
    if (equipmentBudgets["Excavation"] !== undefined) return "Excavation";
    
    // Otherwise try "Other"
    if (equipmentBudgets["Other"] !== undefined) return "Other";
    
    return null;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading equipment data...</div>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-8">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment Optimizer
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Track rentals and optimize equipment costs
              </p>
            </div>
            <div className="flex gap-2">
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
        <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
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
              ${equipment.reduce((sum, eq) => sum + calculateTotalCost(eq), 0).toFixed(0)}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 min-h-[220px] flex flex-col md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <PieChart className="h-4 w-4" />
              Cost Breakdown
            </div>
            <div className="mt-3 flex items-center gap-6 flex-1">
              {/* SVG Pie Chart */}
              <svg width="180" height="180" viewBox="0 0 100 100" className="flex-shrink-0">
                {(() => {
                  let cumulativePercentage = 0;
                  return topEquipment.map(([name, data], index) => {
                    const startAngle = cumulativePercentage * 3.6 - 90;
                    cumulativePercentage += data.percentage;
                    const endAngle = cumulativePercentage * 3.6 - 90;
                    
                    const largeArcFlag = data.percentage > 50 ? 1 : 0;
                    
                    const x1 = 50 + 45 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 50 + 45 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 50 + 45 * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = 50 + 45 * Math.sin((endAngle * Math.PI) / 180);
                    
                    return (
                      <path
                        key={name}
                        d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={pieColors[index % pieColors.length]}
                        stroke="white"
                        strokeWidth="1"
                      />
                    );
                  });
                })()}
              </svg>
              
              {/* Legend */}
              <div className="flex-1 space-y-1">
                {topEquipment.slice(0, 4).map(([name, data], index) => (
                  <div key={name} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    />
                    <span className="text-xs flex-1 break-words" title={name}>
                      {name}
                    </span>
                    <span className="text-xs font-medium flex-shrink-0">{data.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Budget Analysis */}
        <div className="px-6 pb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-lg">EQUIPMENT BUDGET ANALYSIS</h3>
            <Button onClick={() => setShowBudgetDialog(true)} size="sm" variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Edit Budgets
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Equipment Type</th>
                  <th className="text-left py-3 px-4 font-medium">Budget</th>
                  <th className="text-left py-3 px-4 font-medium">Spent to Date</th>
                  <th className="text-left py-3 px-4 font-medium">Variance</th>
                  <th className="text-left py-3 px-4 font-medium">% Complete</th>
                  <th className="text-left py-3 px-4 font-medium">Projected Total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Group equipment by type and calculate totals
                  const typeAnalysis: Record<string, { 
                    budget: number; 
                    spent: number; 
                    active: number;
                    returned: number;
                  }> = {};
                  
                  // Use the state budgets
                  const defaultBudgets = equipmentBudgets;
                  
                  // Calculate actuals by type with intelligent matching
                  equipment.forEach(eq => {
                    const matchedType = matchEquipmentToCategory(eq.name, eq.type || '');
                    
                    if (matchedType) {
                      if (!typeAnalysis[matchedType]) {
                        typeAnalysis[matchedType] = { 
                          budget: defaultBudgets[matchedType],
                          spent: 0,
                          active: 0,
                          returned: 0
                        };
                      }
                      
                      const cost = calculateTotalCost(eq);
                      typeAnalysis[matchedType].spent += cost;
                      
                      if (eq.status === "active") {
                        typeAnalysis[matchedType].active++;
                      } else if (eq.status === "returned") {
                        typeAnalysis[matchedType].returned++;
                      }
                    }
                  });
                  
                  // Only add types that have budgets defined
                  Object.entries(defaultBudgets).forEach(([type, budget]) => {
                    if (!typeAnalysis[type] && budget > 0) {
                      typeAnalysis[type] = { budget, spent: 0, active: 0, returned: 0 };
                    }
                  });
                  
                  return Object.entries(typeAnalysis)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([type, data]) => {
                      const variance = data.spent - data.budget;
                      const percentComplete = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
                      
                      // Simple projection based on current spending rate
                      const projectedTotal = data.active > 0 ? data.spent * 1.2 : data.spent;
                      
                      return (
                        <tr key={type} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: budgetTypeColors[type] || '#6b7280' }}
                              />
                              <div>
                                <div className="font-medium">{type}</div>
                                <div className="text-xs text-muted-foreground">
                                  {data.active} active, {data.returned} returned
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            ${data.budget.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            ${data.spent.toFixed(0)}
                          </td>
                          <td className={`py-3 px-4 font-medium ${
                            variance > 0 ? 'text-red-500' : variance < 0 ? 'text-green-500' : ''
                          }`}>
                            {variance > 0 ? '+' : ''}${variance.toFixed(0)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-700 rounded-full h-2">
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
                          <td className={`py-3 px-4 font-medium ${
                            projectedTotal > data.budget ? 'text-red-500' : 'text-green-500'
                          }`}>
                            ${projectedTotal.toFixed(0)}
                            {projectedTotal > data.budget && (
                              <span className="text-xs block">
                                {((projectedTotal / data.budget - 1) * 100).toFixed(0)}% over
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                })()}
                <tr className="font-semibold bg-muted/30">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4">
                    ${Object.values(equipmentBudgets).reduce((sum, budget) => sum + budget, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    ${equipment.reduce((sum, eq) => sum + calculateTotalCost(eq), 0).toFixed(0)}
                  </td>
                  <td className={`py-3 px-4 font-medium ${
                    equipment.reduce((sum, eq) => sum + calculateTotalCost(eq), 0) > Object.values(equipmentBudgets).reduce((sum, budget) => sum + budget, 0) ? 'text-red-500' : 'text-green-500'
                  }`}>
                    ${(equipment.reduce((sum, eq) => sum + calculateTotalCost(eq), 0) - Object.values(equipmentBudgets).reduce((sum, budget) => sum + budget, 0)).toFixed(0)}
                  </td>
                  <td className="py-3 px-4">
                    {((equipment.reduce((sum, eq) => sum + calculateTotalCost(eq), 0) / Object.values(equipmentBudgets).reduce((sum, budget) => sum + budget, 0)) * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-4">
                    ${(equipment.reduce((sum, eq) => sum + calculateTotalCost(eq), 0) * 1.2).toFixed(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Equipment Rental Optimization Tracker */}
        <div className="px-6 pb-6">
          <div className="mb-4">
            <h3 className="font-medium text-lg">EQUIPMENT RENTAL OPTIMIZATION TRACKER</h3>
          </div>
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
                    <th className="text-left py-3 px-4 font-medium">Recommendation</th>
                    <th className="text-center py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.filter(eq => eq.status === "active").map((eq) => {
                    const daysRented = calculateDaysRented(eq.startDate);
                    const returnDates = getReturnDates(eq.startDate, eq);
                    const daysUntilWeekly = getDaysUntilDate(returnDates.weekly);
                    const daysUntilMonthly = getDaysUntilDate(returnDates.monthly);
                    
                    return (
                      <tr key={eq.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const matchedCategory = matchEquipmentToCategory(eq.name, eq.type || '');
                              const color = matchedCategory && budgetTypeColors[matchedCategory];
                              return color ? (
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: color }}
                                />
                              ) : null;
                            })()}
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
                                  day: 'numeric', 
                                  year: '2-digit',
                                  weekday: 'short'
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Week {Math.ceil(calculateDaysRented(eq.startDate) / 7)} - ${eq.weeklyRate !== null && eq.weeklyRate !== undefined && !isNaN(eq.weeklyRate) ? eq.weeklyRate.toFixed(0) : (eq.rate * 5).toFixed(0)}/wk
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
                                  day: 'numeric', 
                                  year: '2-digit',
                                  weekday: 'short'
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                28 days - ${eq.monthlyRate !== null && eq.monthlyRate !== undefined && !isNaN(eq.monthlyRate) ? eq.monthlyRate.toFixed(0) : (eq.rate * 20).toFixed(0)}/mo
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
                            ${calculateTotalCost(eq).toFixed(0)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            // Calculate recommendation
                            const dailyRate = eq.rate || 0;
                            const weeklyRate = eq.weeklyRate || dailyRate * 7;
                            const monthlyRate = eq.monthlyRate || dailyRate * 30;
                            
                            // Calculate cost breakpoints
                            const threeDaysCost = dailyRate * 3;
                            const threeWeeksCost = weeklyRate * 3;
                            const shouldUseWeekly = threeDaysCost >= weeklyRate;
                            const shouldUseMonthly = threeWeeksCost >= monthlyRate;
                            
                            // Dynamic recommendations based on actual cost optimization
                            if (daysRented <= 2) {
                              const currentCost = dailyRate * daysRented;
                              const weeklyDiff = weeklyRate - currentCost;
                              const monthlyDiff = monthlyRate - currentCost;
                              const extraWeekDays = 7 - daysRented;
                              const extraMonthDays = 28 - daysRented;
                              
                              if (daysRented === 2 && shouldUseWeekly) {
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-orange-500">
                                      Consider weekly upgrade
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      +${weeklyDiff} for {extraWeekDays} more days
                                      (${(weeklyDiff/extraWeekDays).toFixed(0)}/day for extra time)
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-green-500">
                                      Day {daysRented} - Daily rate
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Consider monthly: +${monthlyDiff} for {extraMonthDays} more days
                                      (${(monthlyDiff/extraMonthDays).toFixed(0)}/day)
                                    </div>
                                  </div>
                                );
                              }
                            } else if (daysRented <= 7) {
                              const daysLeft = 7 - daysRented;
                              const currentCost = weeklyRate;
                              const monthlyDiff = monthlyRate - currentCost;
                              const extraDays = 28 - 7;
                              
                              return (
                                <div className="text-sm">
                                  <div className="font-medium text-blue-500">
                                    Week 1 active
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Consider monthly: +${monthlyDiff} for {extraDays} more days
                                    (${(monthlyDiff/extraDays).toFixed(0)}/day for extra time)
                                  </div>
                                </div>
                              );
                            } else if (daysRented <= 14) {
                              const currentWeeks = Math.ceil(daysRented/7);
                              const currentCost = weeklyRate * currentWeeks;
                              const monthlyDiff = monthlyRate - currentCost;
                              const extraDays = 28 - (currentWeeks * 7);
                              
                              if (monthlyDiff > 0 && extraDays > 0) {
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-orange-500">
                                      Consider monthly upgrade
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      +${monthlyDiff} for {extraDays} more days
                                      (${(monthlyDiff/extraDays).toFixed(0)}/day for extra time)
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-blue-500">
                                      Week {currentWeeks} active
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ${currentCost} total - Monthly saves ${Math.abs(monthlyDiff)}
                                    </div>
                                  </div>
                                );
                              }
                            } else if (daysRented <= 21) {
                              const currentWeeks = Math.ceil(daysRented/7);
                              const currentCost = weeklyRate * currentWeeks;
                              const monthlyDiff = monthlyRate - currentCost;
                              const extraDays = 28 - 21;
                              
                              if (daysRented === 21 || shouldUseMonthly) {
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-purple-500">
                                      Upgrade to monthly!
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      +${Math.max(0, monthlyDiff)} for {extraDays} more days
                                      (${monthlyDiff > 0 ? (monthlyDiff/extraDays).toFixed(0) : 'FREE'}/day)
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-orange-500">
                                      Week 3 - Approaching monthly
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Current: ${currentCost}. Monthly: ${monthlyRate}
                                      (+${monthlyDiff} for {extraDays} more days)
                                    </div>
                                  </div>
                                );
                              }
                            } else if (daysRented <= 28) {
                              const daysLeftInMonth = 28 - daysRented;
                              return (
                                <div className="text-sm">
                                  <div className="font-medium text-green-500">
                                    Monthly rate optimal
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ${monthlyRate} for 28 days ({daysLeftInMonth} days left)
                                    Effective: ${(monthlyRate/28).toFixed(0)}/day
                                  </div>
                                </div>
                              );
                            } else {
                              const monthsCount = Math.ceil(daysRented / 28);
                              const currentMonthDays = daysRented - ((monthsCount - 1) * 28);
                              const daysLeftInMonth = 28 - currentMonthDays;
                              const totalCost = calculateTotalCost(eq);
                              
                              // For early in a new month, suggest returning vs keeping
                              if (currentMonthDays <= 7) {
                                const dailyEquivalent = (monthlyRate / 28).toFixed(0);
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-yellow-500">
                                      Month {monthsCount} - Consider return
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {daysLeftInMonth} days left at ${dailyEquivalent}/day effective
                                      (Already paid: ${totalCost.toFixed(0)})
                                    </div>
                                  </div>
                                );
                              } else if (currentMonthDays >= 21) {
                                // Near end of month
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-blue-500">
                                      Keep until month end
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Only {daysLeftInMonth} days left in Month {monthsCount}
                                      (Total spent: ${totalCost.toFixed(0)})
                                    </div>
                                  </div>
                                );
                              } else {
                                // Mid-month
                                const nextMonthCost = monthlyRate;
                                const effectiveDaily = (monthlyRate / 28).toFixed(0);
                                return (
                                  <div className="text-sm">
                                    <div className="font-medium text-green-500">
                                      Month {monthsCount} optimal
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ${effectiveDaily}/day effective rate
                                      (Next month: +${nextMonthCost})
                                    </div>
                                  </div>
                                );
                              }
                            }
                          })()}
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
                        <div className="flex items-center gap-2">
                          {(() => {
                            const matchedCategory = matchEquipmentToCategory(eq.name, eq.type || '');
                            const color = matchedCategory && budgetTypeColors[matchedCategory];
                            return color ? (
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: color }}
                              />
                            ) : null;
                          })()}
                          <div>
                            <div className="font-medium">{eq.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(eq.startDate).toLocaleDateString()} - {eq.endDate && new Date(eq.endDate).toLocaleDateString()}
                            </div>
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
                            ${eq.rate}/{eq.rentalType}
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
      </Card>

      {showAddDialog && (
        <InvoiceUploadDialog
          projectId={projectId}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            fetchEquipment();
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
          onSuccess={() => {
            fetchEquipment();
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
          onSuccess={() => {
            fetchEquipment();
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
            setEquipmentBudgets(budgets);
            setShowBudgetDialog(false);
          }}
        />
      )}
    </>
  );
}