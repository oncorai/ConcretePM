"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { 
  Package, 
  Upload,
  Plus
} from "lucide-react";

interface MaterialBudgetItem {
  id: string;
  costCode: string;
  materialType: string;
  quantity: number;
  unit: string;
  budget: number;
}

interface MaterialBudgetAnalysisProps {
  projectId: string;
}


export function MaterialBudgetAnalysis({ projectId }: MaterialBudgetAnalysisProps) {
  const [budgetItems, setBudgetItems] = useState<MaterialBudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      // Fetch material budget items
      const budgetResponse = await fetch(`/api/projects/${projectId}/material-budget`);
      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json();
        console.log('Material budget data received:', budgetData);
        setBudgetItems(budgetData);
      }
    } catch (error) {
      console.error("Error fetching material budget:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = 0; // TODO: Calculate from actual material purchases

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
    <Card className="bg-card border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" />
              Materials
            </h2>
            <div className="flex gap-8">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Budget</div>
                <div className="text-2xl font-bold mt-1">${totalBudget.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Spent</div>
                <div className="text-2xl font-bold mt-1">${totalSpent.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Variance</div>
                <div className={`text-2xl font-bold mt-1 ${totalSpent > totalBudget ? 'text-red-500' : 'text-green-500'}`}>
                  {totalSpent > totalBudget ? '-' : '+'}${Math.abs(totalSpent - totalBudget).toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">% Complete</div>
                <div className="text-2xl font-bold mt-1">
                  {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {totalSpent > totalBudget ? '% Over' : '% Savings'}
                </div>
                <div className={`text-2xl font-bold mt-1 ${totalSpent > totalBudget ? 'text-red-500' : 'text-green-500'}`}>
                  {totalBudget > 0 ? (
                    totalSpent > totalBudget 
                      ? ((totalSpent / totalBudget - 1) * 100).toFixed(1) + '%'
                      : ((1 - totalSpent / totalBudget) * 100).toFixed(1) + '%'
                  ) : '0%'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Purchase
            </Button>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Invoice
            </Button>
          </div>
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
                  Material Type
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
                const spent = 0; // TODO: Calculate from actual purchases
                const variance = spent - item.budget;
                const percentComplete = item.budget > 0 ? (spent / item.budget) * 100 : 0;
                const projectedTotal = spent * 1.2; // TODO: Better projection logic

                return (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">{item.costCode}</td>
                    <td className="py-3 px-4 font-medium">{item.materialType}</td>
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
      </div>
    </Card>
  );
}