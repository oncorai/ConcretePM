"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { useProject } from "@/context/ProjectContext";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  FileText,
  Award,
  Trash2,
} from "lucide-react";

interface BuyoutCategory {
  id: string;
  name: string;
  orderIndex: number;
}

interface BuyoutQuote {
  id: string;
  supplierName: string;
  supplierContact?: string;
  supplierPhone?: string;
  quotedAmount: number;
  quotedDate: string;
  isWinner: boolean;
  notes?: string;
}

interface BuyoutItem {
  id: string;
  categoryId: string;
  category: BuyoutCategory;
  description: string;
  budgetAmount?: number;
  quantity?: number;
  unit?: string;
  status: string;
  awardedAmount?: number;
  awardedDate?: string;
  quotes: BuyoutQuote[];
  notes?: string;
}

export default function BuyoutPage() {
  const { selectedProject } = useProject();
  const [categories, setCategories] = useState<BuyoutCategory[]>([]);
  const [buyoutItems, setBuyoutItems] = useState<BuyoutItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [showAddQuote, setShowAddQuote] = useState<string | null>(null);

  // Default categories if API not available
  const defaultCategories: BuyoutCategory[] = [
    { id: "1", name: "Concrete", orderIndex: 1 },
    { id: "2", name: "Rebar", orderIndex: 2 },
    { id: "3", name: "Lumber", orderIndex: 3 },
    { id: "4", name: "Vapor Barrier", orderIndex: 4 },
    { id: "5", name: "Bond Breaker", orderIndex: 5 },
    { id: "6", name: "Cure/Densifier", orderIndex: 6 },
    { id: "7", name: "Chair/Dobies", orderIndex: 7 },
    { id: "8", name: "Formsavers", orderIndex: 8 },
    { id: "9", name: "Waterstop", orderIndex: 9 },
    { id: "10", name: "Expansion Joint", orderIndex: 10 },
    { id: "11", name: "Patching", orderIndex: 11 },
    { id: "12", name: "Mastic", orderIndex: 12 },
    { id: "13", name: "Dowels/Dadds", orderIndex: 13 },
    { id: "14", name: "Formwork", orderIndex: 14 },
    { id: "15", name: "Confilm", orderIndex: 15 },
    { id: "16", name: "CJ Plan/Pour Plan", orderIndex: 16 },
  ];

  useEffect(() => {
    loadData();
  }, [selectedProject?.id]);

  async function loadData() {
    // Always load categories
    try {
      const catRes = await fetch("/api/buyout/categories");
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats.length > 0 ? cats : defaultCategories);
      } else {
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories(defaultCategories);
    }

    // Load buyout items only if project selected
    if (!selectedProject?.id) {
      setLoading(false);
      return;
    }

    try {
      const itemsRes = await fetch(`/api/buyout?projectId=${selectedProject.id}`);
      if (itemsRes.ok) {
        const items = await itemsRes.json();
        setBuyoutItems(items);
      }
    } catch (error) {
      console.error("Error loading buyout items:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(categoryId: string) {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  }

  function getItemsForCategory(categoryId: string) {
    return buyoutItems.filter((item) => item.categoryId === categoryId);
  }

  function getCategoryStats(categoryId: string) {
    const items = getItemsForCategory(categoryId);
    const totalBudget = items.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
    const totalAwarded = items.reduce((sum, item) => sum + (item.awardedAmount || 0), 0);
    const awardedCount = items.filter((item) => item.status === "awarded").length;
    return { totalBudget, totalAwarded, awardedCount, totalCount: items.length };
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "awarded":
        return "text-green-600 bg-green-100";
      case "quoted":
        return "text-blue-600 bg-blue-100";
      case "ordered":
        return "text-purple-600 bg-purple-100";
      case "delivered":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  }

  function formatCurrency(amount: number | undefined) {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  async function handleAddItem(categoryId: string, formData: FormData) {
    const description = formData.get("description") as string;
    const budgetAmount = formData.get("budgetAmount") as string;
    const quantity = formData.get("quantity") as string;
    const unit = formData.get("unit") as string;

    try {
      const res = await fetch("/api/buyout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject?.id,
          categoryId,
          description,
          budgetAmount: budgetAmount || null,
          quantity: quantity || null,
          unit: unit || null,
        }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setBuyoutItems([...buyoutItems, newItem]);
        setShowAddItem(null);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  }

  async function handleAddQuote(itemId: string, formData: FormData) {
    const supplierName = formData.get("supplierName") as string;
    const quotedAmount = formData.get("quotedAmount") as string;
    const supplierPhone = formData.get("supplierPhone") as string;

    try {
      const res = await fetch("/api/buyout/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyoutItemId: itemId,
          supplierName,
          quotedAmount,
          supplierPhone: supplierPhone || null,
        }),
      });

      if (res.ok) {
        loadData(); // Reload to get updated items
        setShowAddQuote(null);
      }
    } catch (error) {
      console.error("Error adding quote:", error);
    }
  }

  async function handleAwardQuote(quoteId: string) {
    try {
      const res = await fetch("/api/buyout/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          action: "award",
        }),
      });

      if (res.ok) {
        loadData(); // Reload to get updated items
      }
    } catch (error) {
      console.error("Error awarding quote:", error);
    }
  }

  // Calculate totals
  const totalBudget = buyoutItems.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
  const totalAwarded = buyoutItems.reduce((sum, item) => sum + (item.awardedAmount || 0), 0);
  const variance = totalBudget - totalAwarded;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading buyout tracker...</div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground mb-4">Select or create a project to manage buyouts.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Buyout Tracker</h1>
        <p className="text-muted-foreground mt-1">
          {selectedProject.name} - Track material buyouts, quotes, and awards
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{buyoutItems.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Awarded</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAwarded)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${variance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
              <DollarSign className={`h-5 w-5 ${variance >= 0 ? "text-green-600" : "text-red-600"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variance</p>
              <p className={`text-2xl font-bold ${variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(Math.abs(variance))}
                {variance < 0 ? " over" : " under"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const items = getItemsForCategory(category.id);
          const stats = getCategoryStats(category.id);

          return (
            <Card key={category.id} className="overflow-hidden">
              {/* Category Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <span className="font-semibold">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({stats.totalCount} items)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Budget: {formatCurrency(stats.totalBudget)}
                  </span>
                  <span className="text-green-600">
                    Awarded: {formatCurrency(stats.totalAwarded)}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t">
                  {/* Items List */}
                  {items.length > 0 ? (
                    <div className="divide-y">
                      {items.map((item) => (
                        <div key={item.id} className="p-4 bg-muted/30">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{item.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} {item.unit} • Budget: {formatCurrency(item.budgetAmount)}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>

                          {/* Quotes */}
                          {item.quotes.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">Quotes:</p>
                              {item.quotes.map((quote) => (
                                <div
                                  key={quote.id}
                                  className={`flex items-center justify-between p-2 rounded text-sm ${
                                    quote.isWinner ? "bg-green-100 border border-green-300" : "bg-white border"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {quote.isWinner && <Award className="h-4 w-4 text-green-600" />}
                                    <span className="font-medium">{quote.supplierName}</span>
                                    <span className="text-muted-foreground">
                                      {formatCurrency(quote.quotedAmount)}
                                    </span>
                                  </div>
                                  {!quote.isWinner && item.status !== "awarded" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAwardQuote(quote.id)}
                                    >
                                      Award
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Quote Button */}
                          {showAddQuote === item.id ? (
                            <form
                              className="mt-3 p-3 bg-white rounded border space-y-3"
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleAddQuote(item.id, new FormData(e.currentTarget));
                              }}
                            >
                              <div className="grid grid-cols-3 gap-3">
                                <input
                                  name="supplierName"
                                  placeholder="Supplier Name *"
                                  className="px-3 py-2 border rounded text-sm"
                                  required
                                />
                                <input
                                  name="quotedAmount"
                                  type="number"
                                  step="0.01"
                                  placeholder="Amount *"
                                  className="px-3 py-2 border rounded text-sm"
                                  required
                                />
                                <input
                                  name="supplierPhone"
                                  placeholder="Phone"
                                  className="px-3 py-2 border rounded text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" size="sm">Add Quote</Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowAddQuote(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3"
                              onClick={() => setShowAddQuote(item.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Quote
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No items in this category yet
                    </div>
                  )}

                  {/* Add Item Form */}
                  {showAddItem === category.id ? (
                    <form
                      className="p-4 bg-muted/50 border-t"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddItem(category.id, new FormData(e.currentTarget));
                      }}
                    >
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <input
                          name="description"
                          placeholder="Description *"
                          className="col-span-2 px-3 py-2 border rounded text-sm"
                          required
                        />
                        <input
                          name="budgetAmount"
                          type="number"
                          step="0.01"
                          placeholder="Budget $"
                          className="px-3 py-2 border rounded text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            name="quantity"
                            type="number"
                            step="0.01"
                            placeholder="Qty"
                            className="w-20 px-3 py-2 border rounded text-sm"
                          />
                          <input
                            name="unit"
                            placeholder="Unit"
                            className="w-20 px-3 py-2 border rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Add Item</Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAddItem(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddItem(category.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add {category.name} Item
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
