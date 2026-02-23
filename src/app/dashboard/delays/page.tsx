"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import {
  Plus,
  CloudRain,
  Truck,
  Users,
  Building,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
} from "lucide-react";

interface Delay {
  id: string;
  date: string;
  delayType: string;
  description: string;
  hoursLost: number | null;
  daysLost: number | null;
  responsible: string | null;
  isExcusable: boolean;
  isCompensable: boolean;
}

const delayTypes = [
  { value: "weather", label: "Weather", icon: CloudRain, color: "text-blue-600 bg-blue-100" },
  { value: "material", label: "Material", icon: Truck, color: "text-orange-600 bg-orange-100" },
  { value: "labor", label: "Labor", icon: Users, color: "text-purple-600 bg-purple-100" },
  { value: "gc", label: "GC", icon: Building, color: "text-gray-600 bg-gray-100" },
  { value: "owner", label: "Owner", icon: Building, color: "text-indigo-600 bg-indigo-100" },
  { value: "inspection", label: "Inspection", icon: AlertTriangle, color: "text-yellow-600 bg-yellow-100" },
  { value: "other", label: "Other", icon: Clock, color: "text-gray-600 bg-gray-100" },
];

// Demo data
const demoDelays: Delay[] = [
  {
    id: "1",
    date: "2026-02-20",
    delayType: "weather",
    description: "Rain delay - unable to pour footings. Standing water in excavation.",
    hoursLost: 8,
    daysLost: 1,
    responsible: "Weather",
    isExcusable: true,
    isCompensable: false,
  },
  {
    id: "2",
    date: "2026-02-18",
    delayType: "material",
    description: "Rebar delivery delayed. Supplier short on #5 bars.",
    hoursLost: 4,
    daysLost: 0.5,
    responsible: "Steel Fab Inc",
    isExcusable: false,
    isCompensable: false,
  },
  {
    id: "3",
    date: "2026-02-15",
    delayType: "gc",
    description: "Waiting on surveyor to mark column locations. GC did not schedule.",
    hoursLost: 6,
    daysLost: 0.75,
    responsible: "ABC General Contractors",
    isExcusable: true,
    isCompensable: true,
  },
];

export default function DelaysPage() {
  const [delays, setDelays] = useState<Delay[]>(demoDelays);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  function getDelayTypeInfo(type: string) {
    return delayTypes.find(t => t.value === type) || delayTypes[delayTypes.length - 1];
  }

  const filteredDelays = filterType
    ? delays.filter(d => d.delayType === filterType)
    : delays;

  // Stats
  const totalHoursLost = delays.reduce((sum, d) => sum + (d.hoursLost || 0), 0);
  const totalDaysLost = delays.reduce((sum, d) => sum + (d.daysLost || 0), 0);
  const excusableCount = delays.filter(d => d.isExcusable).length;
  const compensableCount = delays.filter(d => d.isCompensable).length;

  // Group by type for summary
  const delaysByType = delayTypes.map(type => ({
    ...type,
    count: delays.filter(d => d.delayType === type.value).length,
    hours: delays.filter(d => d.delayType === type.value).reduce((sum, d) => sum + (d.hoursLost || 0), 0),
  })).filter(t => t.count > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Delay Log</h1>
          <p className="text-muted-foreground mt-1">
            Track project delays and impacts
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Log Delay
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours Lost</p>
              <p className="text-2xl font-bold">{totalHoursLost}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Days Lost</p>
              <p className="text-2xl font-bold">{totalDaysLost.toFixed(1)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Excusable</p>
              <p className="text-2xl font-bold">{excusableCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Compensable</p>
              <p className="text-2xl font-bold">{compensableCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Delay Type Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={filterType === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType(null)}
        >
          All ({delays.length})
        </Button>
        {delaysByType.map(type => {
          const Icon = type.icon;
          return (
            <Button
              key={type.value}
              variant={filterType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type.value)}
            >
              <Icon className="h-4 w-4 mr-1" />
              {type.label} ({type.count})
            </Button>
          );
        })}
      </div>

      {/* Delay List */}
      <div className="space-y-4">
        {filteredDelays.map((delay) => {
          const typeInfo = getDelayTypeInfo(delay.delayType);
          const Icon = typeInfo.icon;
          
          return (
            <Card key={delay.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">{delay.date}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    {delay.isExcusable && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Excusable
                      </span>
                    )}
                    {delay.isCompensable && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Compensable
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-2">{delay.description}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {delay.hoursLost && <span>{delay.hoursLost} hours lost</span>}
                    {delay.daysLost && <span>{delay.daysLost} days lost</span>}
                    {delay.responsible && <span>Responsible: {delay.responsible}</span>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Log Delay</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full px-3 py-2 border rounded">
                  {delayTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border rounded" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hours Lost</label>
                  <input type="number" step="0.5" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Days Lost</label>
                  <input type="number" step="0.25" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Responsible Party</label>
                <input type="text" className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm">Excusable</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm">Compensable</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit">Save Delay</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
