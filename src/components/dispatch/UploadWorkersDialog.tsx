"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface UploadWorkersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

export default function UploadWorkersDialog({
  open,
  onOpenChange,
  onUploadComplete,
}: UploadWorkersDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    imported: number;
    skipped: number;
    details?: {
      successful: string[];
      errors: string[];
    };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Support both Excel and CSV files
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
        toast.error("Please select an Excel (.xlsx, .xls) or CSV file");
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/dispatch/workers/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);

        if (result.imported > 0) {
          toast.success(`Successfully imported ${result.imported} workers`);
          onUploadComplete();
        }

        if (result.skipped > 0) {
          toast.warning(`${result.skipped} workers were skipped or had errors`);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create a comprehensive template CSV content
    const template = `name,phone,role,email,start_date,emergency_contact,emergency_phone
John Smith,832-555-0101,Foreman,john.smith@email.com,2024-01-15,Jane Smith,832-555-0102
Maria Garcia,713-555-0103,Carpenter,maria.garcia@email.com,2024-02-01,Carlos Garcia,713-555-0104
Mike Johnson,281-555-0105,Operator,mike.j@email.com,2024-01-20,Sarah Johnson,281-555-0106`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded! Fill it out and upload it back.");
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Upload Workers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">File Format Requirements:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">Required Fields:</p>
                <ul className="space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>• name - Full name</li>
                  <li>• phone - Phone number</li>
                  <li>• role - Worker role</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Optional Fields:</p>
                <ul className="space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>• email - Email address</li>
                  <li>• start_date - Employment date</li>
                  <li>• emergency_contact - Name</li>
                  <li>• emergency_phone - Number</li>
                </ul>
              </div>
            </div>
            <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
              Supported roles: Superintendent, Foreman, Carpenter, Operator, Finisher, Sawcutter, Patcher, Laborer, Project Manager, Field Engineer, Safety
            </p>
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              disabled={uploading}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {selectedFile ? selectedFile.name : "Select Excel File"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{uploadResult.imported} imported</span>
                </div>
                {uploadResult.skipped > 0 && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadResult.skipped} skipped</span>
                  </div>
                )}
              </div>

              {/* Details */}
              {uploadResult.details && (
                <div className="space-y-2">
                  {uploadResult.details.successful.length > 0 && (
                    <div className="max-h-32 overflow-y-auto bg-green-50 dark:bg-green-900/20 p-3 rounded text-xs">
                      <div className="font-medium mb-1">Successful:</div>
                      {uploadResult.details.successful.map((msg, i) => (
                        <div key={i}>{msg}</div>
                      ))}
                    </div>
                  )}

                  {uploadResult.details.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/20 p-3 rounded text-xs">
                      <div className="font-medium mb-1">Errors:</div>
                      {uploadResult.details.errors.map((msg, i) => (
                        <div key={i}>{msg}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Template Download */}
          <div className="pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-2" />
              Download Template CSV
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}