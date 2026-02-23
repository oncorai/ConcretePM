"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import {
  Plus,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Truck,
  Wrench,
  Users,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string | null;
  amount: number;
  description: string | null;
  category: string;
  costCode: string | null;
  status: string;
  paidDate: string | null;
  paidAmount: number | null;
}

const categories = [
  { value: "material", label: "Material", icon: Truck, color: "text-blue-600 bg-blue-100" },
  { value: "equipment", label: "Equipment", icon: Wrench, color: "text-orange-600 bg-orange-100" },
  { value: "labor", label: "Labor", icon: Users, color: "text-purple-600 bg-purple-100" },
  { value: "sub", label: "Subcontractor", icon: Building, color: "text-green-600 bg-green-100" },
];

// Demo data
const demoInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2026-0145",
    vendorName: "Martin Marietta",
    invoiceDate: "2026-02-22",
    dueDate: "2026-03-24",
    amount: 12450.00,
    description: "Concrete - Pour 3 (85 CY @ $146.47)",
    category: "material",
    costCode: "03 30 00",
    status: "pending",
    paidDate: null,
    paidAmount: null,
  },
  {
    id: "2",
    invoiceNumber: "INV-8842",
    vendorName: "Steel Fab Inc",
    invoiceDate: "2026-02-18",
    dueDate: "2026-03-18",
    amount: 8750.00,
    description: "Rebar - Foundation package",
    category: "material",
    costCode: "03 20 00",
    status: "approved",
    paidDate: null,
    paidAmount: null,
  },
  {
    id: "3",
    invoiceNumber: "R-445521",
    vendorName: "United Rentals",
    invoiceDate: "2026-02-15",
    dueDate: "2026-03-01",
    amount: 2340.00,
    description: "Concrete pump - 8 hours",
    category: "equipment",
    costCode: "01 50 00",
    status: "paid",
    paidDate: "2026-02-28",
    paidAmount: 2340.00,
  },
  {
    id: "4",
    invoiceNumber: "INV-1122",
    vendorName: "ABC Concrete Pumping",
    invoiceDate: "2026-02-10",
    dueDate: "2026-02-25",
    amount: 1850.00,
    description: "Pump service - Pour 1 & 2",
    category: "sub",
    costCode: "03 30 00",
    status: "paid",
    paidDate: "2026-02-24",
    paidAmount: 1850.00,
  },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  function getCategoryInfo(cat: string) {
    return categories.find(c => c.value === cat) || categories[0];
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "disputed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  function isOverdue(invoice: Invoice) {
    if (invoice.status === "paid" || !invoice.dueDate) return false;
    return new Date(invoice.dueDate) < new Date();
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus && inv.status !== filterStatus) return false;
    if (filterCategory && inv.category !== filterCategory) return false;
    return true;
  });

  // Stats
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status !== "paid").reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = invoices.filter(isOverdue).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoice Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Track vendor invoices and payments
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold">{formatCurrency(paidAmount)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${overdueCount > 0 ? "bg-red-100" : "bg-gray-100"}`}>
              <AlertTriangle className={`h-5 w-5 ${overdueCount > 0 ? "text-red-600" : "text-gray-400"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">{overdueCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={filterStatus === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(null)}
          >
            All Status
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("approved")}
          >
            Approved
          </Button>
          <Button
            variant={filterStatus === "paid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("paid")}
          >
            Paid
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(null)}
          >
            All Types
          </Button>
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.value}
                variant={filterCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(cat.value)}
              >
                <Icon className="h-4 w-4 mr-1" />
                {cat.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Invoice Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Invoice #</th>
                <th className="text-left p-4 font-medium">Vendor</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Due</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-right p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => {
                const catInfo = getCategoryInfo(invoice.category);
                const Icon = catInfo.icon;
                const overdue = isOverdue(invoice);
                
                return (
                  <tr key={invoice.id} className={`hover:bg-muted/30 ${overdue ? "bg-red-50" : ""}`}>
                    <td className="p-4">
                      <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{invoice.vendorName}</p>
                        {invoice.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{invoice.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">{invoice.invoiceDate}</td>
                    <td className="p-4 text-sm">
                      <span className={overdue ? "text-red-600 font-medium" : ""}>
                        {invoice.dueDate || "-"}
                      </span>
                      {overdue && <span className="ml-1 text-red-600">⚠</span>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${catInfo.color}`}>
                        <Icon className="h-3 w-3" />
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      {invoice.status === "pending" && (
                        <Button size="sm" variant="outline">Approve</Button>
                      )}
                      {invoice.status === "approved" && (
                        <Button size="sm" variant="outline">Mark Paid</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Add Invoice</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice #</label>
                  <input type="text" className="w-full px-3 py-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <input type="text" className="w-full px-3 py-2 border rounded" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice Date</label>
                  <input type="date" className="w-full px-3 py-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input type="date" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full px-3 py-2 border rounded">
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost Code</label>
                <input type="text" placeholder="e.g., 03 30 00" className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit">Save Invoice</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
