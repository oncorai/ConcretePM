'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Users, Package, Wrench, FileText, Plus, Trash2, Upload } from 'lucide-react';

interface CrewMember {
  id: string;
  name: string;
  hours: number;
}

interface Equipment {
  id: string;
  name: string;
  action: 'rent' | 'return';
  invoice?: File;
}

export default function DailyReportPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [crew, setCrew] = useState<CrewMember[]>([
    { id: '1', name: '', hours: 8 }
  ]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materialInvoice, setMaterialInvoice] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addCrewMember = () => {
    setCrew([...crew, { id: Date.now().toString(), name: '', hours: 8 }]);
  };

  const removeCrewMember = (id: string) => {
    setCrew(crew.filter(member => member.id !== id));
  };

  const updateCrewMember = (id: string, field: 'name' | 'hours', value: string | number) => {
    setCrew(crew.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const addEquipment = (action: 'rent' | 'return') => {
    setEquipment([...equipment, { 
      id: Date.now().toString(), 
      name: '', 
      action 
    }]);
  };

  const removeEquipment = (id: string) => {
    setEquipment(equipment.filter(eq => eq.id !== id));
  };

  const updateEquipment = (id: string, field: 'name' | 'invoice', value: any) => {
    setEquipment(equipment.map(eq => 
      eq.id === id ? { ...eq, [field]: value } : eq
    ));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Calculate total hours
    const totalHours = crew.reduce((sum, member) => sum + member.hours, 0);
    const workerCount = crew.filter(member => member.name).length;
    
    console.log('Daily Report:', {
      date,
      crew,
      totalHours,
      workerCount,
      equipment,
      materialInvoice: materialInvoice?.name,
      notes
    });
    
    // TODO: Submit to API
    
    setTimeout(() => {
      setSubmitting(false);
      alert('Daily report submitted successfully!');
    }, 1000);
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Daily Site Report</h1>
      
      {/* Date Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Crew Hours */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Crew Hours
          </CardTitle>
          <CardDescription>
            Record who worked and for how many hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {crew.map((member, index) => (
            <div key={member.id} className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Worker {index + 1}</Label>
                <Input
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) => updateCrewMember(member.id, 'name', e.target.value)}
                />
              </div>
              <div className="w-32">
                <Label>Hours</Label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={member.hours}
                  onChange={(e) => updateCrewMember(member.id, 'hours', parseFloat(e.target.value) || 0)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeCrewMember(member.id)}
                disabled={crew.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addCrewMember}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Worker
          </Button>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              Total: {crew.filter(m => m.name).length} workers, {crew.reduce((sum, m) => sum + m.hours, 0)} hours
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Purchases */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Purchases
          </CardTitle>
          <CardDescription>
            Upload invoices for materials purchased today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              id="material-upload"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setMaterialInvoice(e.target.files?.[0] || null)}
            />
            <label htmlFor="material-upload" className="cursor-pointer">
              {materialInvoice ? (
                <div>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">{materialInvoice.name}</p>
                  <p className="text-xs text-muted-foreground mt-2">Click to change</p>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload invoice</p>
                  <p className="text-xs text-muted-foreground mt-2">PDF, PNG, or JPEG</p>
                </div>
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Rentals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Equipment Rentals
          </CardTitle>
          <CardDescription>
            Track equipment rented or returned today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {equipment.map((eq) => (
            <div key={eq.id} className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Equipment Name</Label>
                <Input
                  placeholder={eq.action === 'rent' ? 'e.g., Excavator CAT 320' : 'e.g., Concrete Mixer'}
                  value={eq.name}
                  onChange={(e) => updateEquipment(eq.id, 'name', e.target.value)}
                />
              </div>
              <div className="w-32">
                <Label>Action</Label>
                <div className={`px-3 py-2 rounded-md text-sm font-medium ${
                  eq.action === 'rent' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {eq.action === 'rent' ? 'Rented' : 'Returned'}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeEquipment(eq.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => addEquipment('rent')}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rental
            </Button>
            <Button
              variant="outline"
              onClick={() => addEquipment('return')}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Return
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md"
            placeholder="Any issues, delays, or important information..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || crew.filter(m => m.name).length === 0}
        >
          {submitting ? 'Submitting...' : 'Submit Daily Report'}
        </Button>
      </div>
    </div>
  );
}