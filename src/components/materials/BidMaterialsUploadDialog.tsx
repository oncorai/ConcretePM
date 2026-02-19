"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";

interface BidItem {
  type: string;
  description: string;
  quantity: string;
  unit: string;
  materialTotal: string;
  costCode: string;
}

interface MaterialPhase {
  costCode: string;
  phaseName: string;
  items: BidItem[];
  totalBudget: number;
}

interface BidMaterialsUploadDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BidMaterialsUploadDialog({ 
  projectId, 
  open, 
  onOpenChange,
  onSuccess
}: BidMaterialsUploadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<MaterialPhase[]>([]);
  const [parseError, setParseError] = useState<string>("");
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParseError("");
      setParsedData([]);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    setParseError("");
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/projects/${projectId}/parse-bid-materials`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse bid materials");
      }
      
      if (data.phases && data.phases.length > 0) {
        setParsedData(data.phases);
        // Expand first few phases by default
        const initialExpanded = new Set<string>(data.phases.slice(0, 3).map((p: MaterialPhase) => p.costCode));
        setExpandedPhases(initialExpanded);
      } else {
        setParseError("No materials found in the file.");
      }
    } catch (error) {
      console.error("Error parsing bid materials:", error);
      setParseError(error instanceof Error ? error.message : "Failed to parse bid materials.");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (parsedData.length === 0) return;

    setLoading(true);
    try {
      // Save parsed materials data
      const response = await fetch(`/api/projects/${projectId}/import-bid-materials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phases: parsedData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Import error:", error);
        throw new Error(error.details || error.error || "Failed to import materials");
      }

      const result = await response.json();
      console.log("Import result:", result);
      
      onSuccess();
      onOpenChange(false);
      // Reset state
      setFile(null);
      setParsedData([]);
      setParseError("");
    } catch (error) {
      console.error("Error saving materials:", error);
      alert(error instanceof Error ? error.message : "Failed to save materials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (costCode: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(costCode)) {
      newExpanded.delete(costCode);
    } else {
      newExpanded.add(costCode);
    }
    setExpandedPhases(newExpanded);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="relative bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upload Bid Materials CSV</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* File Upload */}
          {!parsedData.length && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <label htmlFor="bid-upload" className="cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    Drop your bid CSV here or{" "}
                    <span className="text-primary font-medium">click to browse</span>
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">
                    Select the bid CSV file with material costs in column S
                  </p>
                  <input
                    id="bid-upload"
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileSelect}
                  />
                </label>
                {file && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>{file.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {file && !parsing && (
                <div className="flex justify-center">
                  <Button onClick={handleParse}>
                    Parse Materials
                  </Button>
                </div>
              )}

              {parsing && (
                <div className="text-center text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    Parsing bid materials...
                  </div>
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-sm text-red-500">{parseError}</div>
                </div>
              )}
            </div>
          )}

          {/* Parsed Results */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Found {parsedData.length} material phases with {parsedData.reduce((sum, p) => sum + p.items.length, 0)} items
                  </span>
                </div>
                <div className="text-sm font-medium">
                  Total Budget: ${parsedData.reduce((sum, p) => sum + p.totalBudget, 0).toLocaleString()}
                </div>
              </div>

              <div className="space-y-3">
                {parsedData.map((phase) => (
                  <div key={phase.costCode} className="border border-border rounded-lg">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                      onClick={() => togglePhase(phase.costCode)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedPhases.has(phase.costCode) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div>
                          <h4 className="font-medium">{phase.phaseName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {phase.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${phase.totalBudget.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Budget</p>
                      </div>
                    </div>
                    
                    {expandedPhases.has(phase.costCode) && (
                      <div className="border-t border-border">
                        <table className="w-full">
                          <thead className="bg-muted/30">
                            <tr className="text-xs">
                              <th className="text-left p-3">Description</th>
                              <th className="text-right p-3">Quantity</th>
                              <th className="text-left p-3">Unit</th>
                              <th className="text-right p-3">Budget</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {phase.items.map((item, index) => (
                              <tr key={index} className="text-sm">
                                <td className="p-3">{item.description}</td>
                                <td className="p-3 text-right">{item.quantity}</td>
                                <td className="p-3">{item.unit}</td>
                                <td className="p-3 text-right">{item.materialTotal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsedData([]);
                    setFile(null);
                    setParseError("");
                  }}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button onClick={handleConfirm} disabled={loading}>
                  {loading ? "Saving..." : "Import Materials"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}