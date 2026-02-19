'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, DollarSign, HardHat, Package, Users, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';

interface CostItem {
  costCode: string;
  phase: string;
  subphase: string;
  quantity: string;
  unit: string;
  budget: string;
  hours: string;
}

interface CostData {
  projectName: string;
  costItems: CostItem[];
}

export default function ImportCostPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setCostData(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-cost-data-v2', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse file');
      }

      const data = await response.json();
      setCostData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveToProject = async () => {
    if (!costData) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/projects/create-from-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(costData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const { projectId, additionalData } = await response.json();
      
      // Show success message with what was created
      console.log('Project created with:', additionalData);
      
      // Redirect to project page
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Cost Spreadsheet</h1>
        <p className="text-muted-foreground mt-2">
          Upload your construction cost spreadsheet to automatically organize costs by category
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Spreadsheet</CardTitle>
          <CardDescription>
            Supports CSV and Excel files with cost breakdown by Labor, Materials, Equipment, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                  Select file
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="mt-6"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload & Parse
              </Button>
            </div>

            {loading && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Processing file...</p>
                <Progress value={uploadProgress} />
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-900/20 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            )}

            {file && !loading && !error && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{file.name}</span>
                <span>({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {costData && (
        <>
          {/* Cost Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Parsed Cost Data</CardTitle>
              <CardDescription>
                Labor costs organized by phase and subphase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phase</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Subphase</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {costData.costItems.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{item.costCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.phase}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.subphase}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{item.budget}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{item.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              variant="default" 
              onClick={handleSaveToProject}
              disabled={saving}
            >
              {saving ? 'Creating Project...' : 'Create Project'}
            </Button>
            <Button variant="outline" onClick={() => {
              setFile(null);
              setCostData(null);
              setError(null);
            }}>
              Upload Another File
            </Button>
          </div>
        </>
      )}
    </div>
  );
}