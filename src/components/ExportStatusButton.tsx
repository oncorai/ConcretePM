"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface ExportStatusButtonProps {
  projectId: string;
  projectName: string;
}

export function ExportStatusButton({ projectId, projectName }: ExportStatusButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/export-status`);
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("Export failed with status:", response.status, errorData);
          throw new Error(`Failed to export: ${errorData.details || errorData.error || response.status}`);
        } else {
          console.error("Export failed with status:", response.status);
          throw new Error(`Failed to export: ${response.status}`);
        }
      }
      
      const html = await response.text();
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for content to load then trigger print dialog
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        throw new Error("Pop-up blocked. Please allow pop-ups for this site.");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export project report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-600 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {loading ? "Generating..." : "Export Report"}
    </button>
  );
}