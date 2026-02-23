"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import {
  Plus,
  Droplets,
  MapPin,
  Clock,
  Truck,
  Thermometer,
  TestTube,
  Users,
  Calendar,
} from "lucide-react";

interface Pour {
  id: string;
  pourDate: string;
  pourNumber: string;
  location: string;
  element: string;
  mixDesign: string;
  supplier: string;
  orderedCY: number | null;
  placedCY: number | null;
  returnedCY: number | null;
  startTime: string | null;
  endTime: string | null;
  slump: string | null;
  airContent: string | null;
  temperature: string | null;
  cylindersTaken: number | null;
  weather: string | null;
  crewSize: number | null;
}

// Demo data
const demoPours: Pour[] = [
  {
    id: "1",
    pourDate: "2026-02-22",
    pourNumber: "Pour 3",
    location: "Foundation Grid A-C / 1-3",
    element: "Footing",
    mixDesign: "4000 PSI",
    supplier: "Martin Marietta",
    orderedCY: 85,
    placedCY: 82,
    returnedCY: 3,
    startTime: "06:30",
    endTime: "11:45",
    slump: "4 inch",
    airContent: "5.5%",
    temperature: "68°F",
    cylindersTaken: 6,
    weather: "Clear, 72°F",
    crewSize: 8,
  },
  {
    id: "2",
    pourDate: "2026-02-19",
    pourNumber: "Pour 2",
    location: "Foundation Grid D-F / 1-3",
    element: "Footing",
    mixDesign: "4000 PSI",
    supplier: "Martin Marietta",
    orderedCY: 72,
    placedCY: 70,
    returnedCY: 2,
    startTime: "07:00",
    endTime: "11:00",
    slump: "4.5 inch",
    airContent: "5.2%",
    temperature: "65°F",
    cylindersTaken: 6,
    weather: "Overcast, 65°F",
    crewSize: 7,
  },
  {
    id: "3",
    pourDate: "2026-02-15",
    pourNumber: "Pour 1",
    location: "Foundation Grid G-J / 1-3",
    element: "Footing",
    mixDesign: "4000 PSI",
    supplier: "Martin Marietta",
    orderedCY: 65,
    placedCY: 63,
    returnedCY: 2,
    startTime: "06:00",
    endTime: "10:30",
    slump: "4 inch",
    airContent: "5.0%",
    temperature: "70°F",
    cylindersTaken: 4,
    weather: "Sunny, 70°F",
    crewSize: 6,
  },
];

export default function PoursPage() {
  const [pours, setPours] = useState<Pour[]>(demoPours);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPour, setSelectedPour] = useState<Pour | null>(null);

  // Stats
  const totalPours = pours.length;
  const totalOrdered = pours.reduce((sum, p) => sum + (p.orderedCY || 0), 0);
  const totalPlaced = pours.reduce((sum, p) => sum + (p.placedCY || 0), 0);
  const totalReturned = pours.reduce((sum, p) => sum + (p.returnedCY || 0), 0);
  const wastePercent = totalOrdered > 0 ? ((totalReturned / totalOrdered) * 100).toFixed(1) : "0";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pour Log</h1>
          <p className="text-muted-foreground mt-1">
            Concrete placement records and testing
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Pour
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Droplets className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pours</p>
              <p className="text-2xl font-bold">{totalPours}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Truck className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ordered</p>
              <p className="text-2xl font-bold">{totalOrdered} CY</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Droplets className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Placed</p>
              <p className="text-2xl font-bold">{totalPlaced} CY</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Truck className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Returned</p>
              <p className="text-2xl font-bold">{totalReturned} CY</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${parseFloat(wastePercent) > 5 ? "bg-red-100" : "bg-green-100"}`}>
              <TestTube className={`h-5 w-5 ${parseFloat(wastePercent) > 5 ? "text-red-600" : "text-green-600"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Waste %</p>
              <p className="text-2xl font-bold">{wastePercent}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pour List */}
      <div className="space-y-4">
        {pours.map((pour) => (
          <Card
            key={pour.id}
            className="p-4 cursor-pointer hover:bg-muted/30"
            onClick={() => setSelectedPour(pour)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-lg">{pour.pourNumber}</span>
                  <span className="text-muted-foreground">{pour.pourDate}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {pour.element}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{pour.location}</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mix: </span>
                    <span className="font-medium">{pour.mixDesign}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Placed: </span>
                    <span className="font-medium">{pour.placedCY} CY</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Slump: </span>
                    <span className="font-medium">{pour.slump || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cylinders: </span>
                    <span className="font-medium">{pour.cylindersTaken || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedPour && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedPour.pourNumber}</h2>
                <p className="text-muted-foreground">{selectedPour.pourDate}</p>
              </div>
              <span className="px-3 py-1 rounded font-medium bg-blue-100 text-blue-800">
                {selectedPour.element}
              </span>
            </div>

            <div className="space-y-6">
              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{selectedPour.location}</span>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-3 text-center">
                  <p className="text-sm text-muted-foreground">Ordered</p>
                  <p className="text-xl font-bold">{selectedPour.orderedCY} CY</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-sm text-muted-foreground">Placed</p>
                  <p className="text-xl font-bold text-green-600">{selectedPour.placedCY} CY</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-sm text-muted-foreground">Returned</p>
                  <p className="text-xl font-bold text-red-600">{selectedPour.returnedCY} CY</p>
                </Card>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mix Design</p>
                  <p className="font-medium">{selectedPour.mixDesign}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedPour.supplier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Time</p>
                  <p className="font-medium">{selectedPour.startTime || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Time</p>
                  <p className="font-medium">{selectedPour.endTime || "-"}</p>
                </div>
              </div>

              {/* Testing */}
              <div>
                <h3 className="font-semibold mb-3">Field Testing</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Slump</p>
                    <p className="font-medium">{selectedPour.slump || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Air Content</p>
                    <p className="font-medium">{selectedPour.airContent || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Temperature</p>
                    <p className="font-medium">{selectedPour.temperature || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cylinders</p>
                    <p className="font-medium">{selectedPour.cylindersTaken || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Weather</p>
                  <p className="font-medium">{selectedPour.weather || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Crew Size</p>
                  <p className="font-medium">{selectedPour.crewSize || "-"} workers</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedPour(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New Pour Log</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pour Date</label>
                  <input type="date" className="w-full px-3 py-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Element</label>
                  <select className="w-full px-3 py-2 border rounded">
                    <option>Footing</option>
                    <option>Slab</option>
                    <option>Wall</option>
                    <option>Column</option>
                    <option>Beam</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input type="text" placeholder="e.g., Grid A-C / 1-3" className="w-full px-3 py-2 border rounded" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mix Design</label>
                  <input type="text" placeholder="e.g., 4000 PSI" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <input type="text" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ordered (CY)</label>
                  <input type="number" step="0.1" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Placed (CY)</label>
                  <input type="number" step="0.1" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Returned (CY)</label>
                  <input type="number" step="0.1" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input type="time" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input type="time" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Slump</label>
                  <input type="text" placeholder="4 inch" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Air %</label>
                  <input type="text" placeholder="5.5%" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Temp</label>
                  <input type="text" placeholder="68°F" className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cylinders</label>
                  <input type="number" className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit">Save Pour</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
