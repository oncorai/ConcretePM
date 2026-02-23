"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import {
  Plus,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
} from "lucide-react";

interface RFI {
  id: string;
  number: string;
  subject: string;
  question: string;
  from: string;
  to: string;
  dateSubmitted: string;
  dateRequired: string | null;
  dateAnswered: string | null;
  answer: string | null;
  costImpact: boolean;
  scheduleImpact: boolean;
  impactDays: number | null;
  status: string;
}

// Demo data
const demoRFIs: RFI[] = [
  {
    id: "1",
    number: "001",
    subject: "Foundation Depth at Grid A-1",
    question: "Plans show 24\" deep footing at Grid A-1 but geotech report recommends 30\" minimum. Please clarify required depth.",
    from: "Concrete Sub",
    to: "Engineer",
    dateSubmitted: "2026-02-10",
    dateRequired: "2026-02-14",
    dateAnswered: "2026-02-13",
    answer: "Increase footing depth to 30\" as recommended by geotech. Add additional rebar per detail SK-1.",
    costImpact: true,
    scheduleImpact: false,
    impactDays: null,
    status: "closed",
  },
  {
    id: "2",
    number: "002",
    subject: "Rebar Lap Splice Length",
    question: "Structural notes indicate #5 rebar lap = 24\". Standard practice for 4000 PSI concrete is 30\". Please confirm.",
    from: "Concrete Sub",
    to: "Engineer",
    dateSubmitted: "2026-02-15",
    dateRequired: "2026-02-20",
    dateAnswered: null,
    answer: null,
    costImpact: false,
    scheduleImpact: false,
    impactDays: null,
    status: "open",
  },
  {
    id: "3",
    number: "003",
    subject: "Slab Edge at Loading Dock",
    question: "Detail shows 6\" slab at loading dock. Typical for this use is 8\" minimum. Request clarification on slab thickness.",
    from: "Concrete Sub",
    to: "Architect",
    dateSubmitted: "2026-02-18",
    dateRequired: "2026-02-25",
    dateAnswered: null,
    answer: null,
    costImpact: true,
    scheduleImpact: true,
    impactDays: 3,
    status: "open",
  },
];

export default function RFIsPage() {
  const [rfis, setRFIs] = useState<RFI[]>(demoRFIs);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);

  function getStatusColor(status: string) {
    switch (status) {
      case "closed":
        return "bg-green-100 text-green-800";
      case "answered":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  }

  // Stats
  const openCount = rfis.filter(r => r.status === "open").length;
  const closedCount = rfis.filter(r => r.status === "closed").length;
  const withCostImpact = rfis.filter(r => r.costImpact).length;
  const withScheduleImpact = rfis.filter(r => r.scheduleImpact).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">RFI Log</h1>
          <p className="text-muted-foreground mt-1">
            Requests for Information - questions to architect/engineer
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> New RFI
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold">{openCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Closed</p>
              <p className="text-2xl font-bold">{closedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cost Impact</p>
              <p className="text-2xl font-bold">{withCostImpact}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Schedule Impact</p>
              <p className="text-2xl font-bold">{withScheduleImpact}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* RFI List */}
      <div className="space-y-4">
        {rfis.map((rfi) => (
          <Card
            key={rfi.id}
            className="p-4 cursor-pointer hover:bg-muted/30"
            onClick={() => setSelectedRFI(rfi)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-bold">RFI-{rfi.number}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(rfi.status)}`}>
                    {rfi.status.toUpperCase()}
                  </span>
                  {rfi.costImpact && (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <DollarSign className="h-3 w-3" /> Cost
                    </span>
                  )}
                  {rfi.scheduleImpact && (
                    <span className="flex items-center gap-1 text-xs text-orange-600">
                      <Calendar className="h-3 w-3" /> {rfi.impactDays} days
                    </span>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{rfi.subject}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{rfi.question}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>From: {rfi.from}</span>
                  <span>To: {rfi.to}</span>
                  <span>Submitted: {rfi.dateSubmitted}</span>
                  {rfi.dateRequired && <span>Due: {rfi.dateRequired}</span>}
                </div>
              </div>
            </div>

            {/* Answer if closed */}
            {rfi.answer && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-medium text-green-800 mb-1">Response:</p>
                <p className="text-sm text-green-900">{rfi.answer}</p>
                <p className="text-xs text-green-600 mt-2">Answered: {rfi.dateAnswered}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Form Modal placeholder */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">New RFI</h2>
            <p className="text-muted-foreground mb-4">Form coming soon...</p>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRFI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-lg font-bold">RFI-{selectedRFI.number}</span>
                <h2 className="text-xl font-bold mt-1">{selectedRFI.subject}</h2>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(selectedRFI.status)}`}>
                {selectedRFI.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Question:</p>
                <p className="mt-1">{selectedRFI.question}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">From</p>
                  <p>{selectedRFI.from}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">To</p>
                  <p>{selectedRFI.to}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Submitted</p>
                  <p>{selectedRFI.dateSubmitted}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Required By</p>
                  <p>{selectedRFI.dateRequired || "-"}</p>
                </div>
              </div>

              {selectedRFI.answer && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="font-medium text-green-800 mb-2">Response:</p>
                  <p className="text-green-900">{selectedRFI.answer}</p>
                  <p className="text-sm text-green-600 mt-2">Answered: {selectedRFI.dateAnswered}</p>
                </div>
              )}

              <div className="flex gap-4">
                {selectedRFI.costImpact && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Has cost impact</span>
                  </div>
                )}
                {selectedRFI.scheduleImpact && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{selectedRFI.impactDays} day schedule impact</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedRFI(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
