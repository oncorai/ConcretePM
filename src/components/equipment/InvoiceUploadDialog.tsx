"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface EquipmentBudgetItem {
  id: string;
  costCode: string;
  equipmentType: string;
  quantity: number;
  unit: string;
  budget: number;
}

interface InvoiceUploadDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  budgetItems?: EquipmentBudgetItem[];
}

interface ParsedEquipment {
  name: string;
  type: string;
  supplier: string;
  startDate: string;
  endDate?: string;
  rentalType: string;
  rate: number;
  location?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  costCode?: string;
}

export function InvoiceUploadDialog({ 
  projectId, 
  open, 
  onOpenChange,
  onSuccess,
  budgetItems = []
}: InvoiceUploadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [parsedData, setParsedData] = useState<ParsedEquipment[]>([]);
  const [parseErrors, setParseErrors] = useState<{ file: string; error: string }[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [costCodeAssignments, setCostCodeAssignments] = useState<Record<number, string>>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(Array.from(selectedFiles));
      setParseErrors([]);
      setParsedData([]);
      setCurrentFileIndex(0);
    }
  };

  const handleParse = async () => {
    if (files.length === 0) return;

    setParsing(true);
    setParseErrors([]);
    const allParsedData: ParsedEquipment[] = [];
    const errors: { file: string; error: string }[] = [];
    
    // Parse each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFileIndex(i);
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);

        const response = await fetch(`/api/projects/${projectId}/equipment/parse-invoice`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to parse invoice");
        }
        
        if (data.message && data.equipment.length === 0) {
          errors.push({ file: file.name, error: data.message });
          if (data.debugInfo) {
            console.error(`Debug info for ${file.name}:`, data.debugInfo);
          }
        } else if (data.equipment && data.equipment.length > 0) {
          allParsedData.push(...data.equipment);
        } else {
          errors.push({ file: file.name, error: "No equipment found in the invoice." });
        }
      } catch (error) {
        console.error(`Error parsing ${file.name}:`, error);
        errors.push({ 
          file: file.name, 
          error: error instanceof Error ? error.message : "Failed to parse invoice." 
        });
      }
    }
    
    setParsedData(allParsedData);
    setParseErrors(errors);
    setParsing(false);
  };

  const handleConfirm = async () => {
    if (parsedData.length === 0) return;

    setLoading(true);
    try {
      // Save all parsed equipment items with cost codes
      for (let i = 0; i < parsedData.length; i++) {
        const equipment = parsedData[i];
        const costCode = costCodeAssignments[i] || '';
        
        const response = await fetch(`/api/projects/${projectId}/equipment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...equipment,
            status: "active",
            type: costCode ? `${costCode}-${equipment.type}` : equipment.type
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Equipment save error:", errorData);
          throw new Error(errorData.error || "Failed to save equipment");
        }
      }

      onSuccess();
      // Reset state
      setFiles([]);
      setParsedData([]);
      setParseErrors([]);
      setCostCodeAssignments({});
    } catch (error) {
      console.error("Error saving equipment:", error);
      alert("Failed to save equipment. Please try again.");
    } finally {
      setLoading(false);
    }
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
      <div className="relative bg-background border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-lg">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upload Equipment Invoices</h2>
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

        <div className="p-6 space-y-6">
          {/* File Upload */}
          {!parsedData.length && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <label htmlFor="invoice-upload" className="cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    Drop your invoices here or{" "}
                    <span className="text-primary font-medium">click to browse</span>
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">
                    You can select multiple files at once
                  </p>
                  <input
                    id="invoice-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.png,.jpg,.jpeg"
                    multiple
                    onChange={handleFileSelect}
                  />
                </label>
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-center">
                      {files.length} file{files.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sample Format Info */}
              <div className="bg-muted/50 rounded-lg p-4 text-xs">
                <p className="font-medium mb-2">Supported formats:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• PDF invoices (✓ Supported)</li>
                  <li>• Text files with equipment lists</li>
                  <li>• Images (PNG, JPG - coming soon)</li>
                </ul>
                <p className="mt-2 text-muted-foreground">
                  The parser will automatically extract equipment names, rental rates, and dates from your invoice.
                </p>
              </div>

              {files.length > 0 && !parsing && (
                <div className="flex justify-center">
                  <Button onClick={handleParse}>
                    Parse {files.length} Invoice{files.length > 1 ? 's' : ''}
                  </Button>
                </div>
              )}

              {parsing && (
                <div className="text-center text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    Parsing invoices... ({currentFileIndex + 1}/{files.length})
                  </div>
                  <div className="text-xs mt-2">
                    Processing: {files[currentFileIndex]?.name}
                  </div>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-500">
                    {parseErrors.length} file{parseErrors.length > 1 ? 's' : ''} failed to parse:
                  </p>
                  {parseErrors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-medium">{error.file}:</span> {error.error}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Parsed Results */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Successfully parsed {parsedData.length} equipment items</span>
                </div>
                {files.length > 1 && (
                  <div className="text-sm text-muted-foreground">
                    From {files.length - parseErrors.length} of {files.length} invoices
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {parsedData.map((equipment, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">{equipment.name}</h4>
                        <p className="text-sm text-muted-foreground">{equipment.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${equipment.rate}/{equipment.rentalType}</p>
                        <p className="text-sm text-muted-foreground">{equipment.supplier}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Assign to Cost Code:</label>
                        <select
                          value={costCodeAssignments[index] || ''}
                          onChange={(e) => {
                            setCostCodeAssignments({
                              ...costCodeAssignments,
                              [index]: e.target.value
                            });
                          }}
                          className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">No cost code assigned</option>
                          {budgetItems.map((item) => (
                            <option key={item.id} value={item.costCode}>
                              {item.costCode} - {item.equipmentType}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {new Date(equipment.startDate).toLocaleDateString()} - {
                            equipment.endDate ? new Date(equipment.endDate).toLocaleDateString() : "Ongoing"
                          }
                        </span>
                        {equipment.invoiceNumber && (
                          <span>Invoice #{equipment.invoiceNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsedData([]);
                    setFiles([]);
                    setParseErrors([]);
                    setCostCodeAssignments({});
                  }}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button onClick={handleConfirm} disabled={loading}>
                  {loading ? "Saving..." : "Confirm & Save"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}