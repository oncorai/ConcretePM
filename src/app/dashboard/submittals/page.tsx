"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Submittal {
  id: string;
  number: string;
  revision: string;
  specSection: string;
  description: string;
  submittedTo: string;
  submittedBy: string;
  dateSubmitted: string | null;
  dateRequired: string | null;
  dateReturned: string | null;
  status: string;
}

// Demo data
const demoSubmittals: Submittal[] = [
  {
    id: "1",
    number: "001",
    revision: "0",
    specSection: "03 30 00",
    description: "Concrete Mix Design - 4000 PSI",
    submittedTo: "Architect",
    submittedBy: "Ready Mix Co",
    dateSubmitted: "2026-02-15",
    dateRequired: "2026-02-22",
    dateReturned: "2026-02-20",
    status: "approved",
  },
  {
    id: "2",
    number: "002",
    revision: "0",
    specSection: "03 20 00",
    description: "Rebar Shop Drawings - Foundation",
    submittedTo: "Engineer",
    submittedBy: "Steel Fab Inc",
    dateSubmitted: "2026-02-18",
    dateRequired: "2026-02-25",
    dateReturned: null,
    status: "submitted",
  },
  {
    id: "3",
    number: "003",
    revision: "1",
    specSection: "07 10 00",
    description: "Vapor Barrier - 15 mil poly",
    submittedTo: "Architect",
    submittedBy: "Stego Industries",
    dateSubmitted: "2026-02-20",
    dateRequired: "2026-02-27",
    dateReturned: null,
    status: "revise_resubmit",
  },
];

export default function SubmittalsPage() {
  const [submittals, setSubmittals] = useState<Submittal[]>(demoSubmittals);
  const [showAddForm, setShowAddForm] = useState(false);

  function getStatusIcon(status: string) {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "approved_as_noted":
        return <CheckCircle className="h-5 w-5 text-yellow-600" />;
      case "revise_resubmit":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "approved_as_noted":
        return "bg-yellow-100 text-yellow-800";
      case "revise_resubmit":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function formatStatus(status: string) {
    return status.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  // Stats
  const pending = submittals.filter(s => s.status === "pending" || s.status === "submitted").length;
  const approved = submittals.filter(s => s.status === "approved" || s.status === "approved_as_noted").length;
  const needsAction = submittals.filter(s => s.status === "revise_resubmit").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Submittal Log</h1>
          <p className="text-muted-foreground mt-1">
            Track product data, shop drawings, and approvals
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Submittal
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
              <p className="text-2xl font-bold">{submittals.length}</p>
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
              <p className="text-2xl font-bold">{pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{approved}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Needs Action</p>
              <p className="text-2xl font-bold">{needsAction}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Submittal Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">No.</th>
                <th className="text-left p-4 font-medium">Spec</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-left p-4 font-medium">From</th>
                <th className="text-left p-4 font-medium">To</th>
                <th className="text-left p-4 font-medium">Submitted</th>
                <th className="text-left p-4 font-medium">Required</th>
                <th className="text-left p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submittals.map((submittal) => (
                <tr key={submittal.id} className="hover:bg-muted/30">
                  <td className="p-4 font-mono">
                    {submittal.number}
                    {submittal.revision !== "0" && (
                      <span className="text-muted-foreground">.{submittal.revision}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">{submittal.specSection}</td>
                  <td className="p-4">{submittal.description}</td>
                  <td className="p-4 text-sm">{submittal.submittedBy}</td>
                  <td className="p-4 text-sm">{submittal.submittedTo}</td>
                  <td className="p-4 text-sm">{submittal.dateSubmitted || "-"}</td>
                  <td className="p-4 text-sm">{submittal.dateRequired || "-"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(submittal.status)}`}>
                      {getStatusIcon(submittal.status)}
                      {formatStatus(submittal.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Form Modal placeholder */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">New Submittal</h2>
            <p className="text-muted-foreground mb-4">Form coming soon...</p>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Close
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
