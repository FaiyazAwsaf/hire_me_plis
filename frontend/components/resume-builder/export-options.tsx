"use client";

import React from "react";
import { Resume } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Download, FileJson } from "lucide-react";
import { generateResumeHTML, downloadJSON } from "@/lib/resume/utils";

interface ExportOptionsProps {
  resume: Resume;
}

/**
 * ExportOptions Component
 * Provides export functionality for resume
 * Supports PDF and JSON export
 */
export function ExportOptions({ resume }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      // Generate HTML
      const html = generateResumeHTML(resume);

      // Create a new window with the HTML
      const printWindow = window.open("", "", "height=800,width=1000");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print();
          // After printing, close the window
          setTimeout(() => {
            printWindow.close();
          }, 100);
        };
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleJSONExport = () => {
    downloadJSON(resume);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handlePDFExport}
        disabled={isExporting || !resume.personalInfo.fullName}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export as PDF"}
      </Button>

      <Button
        onClick={handleJSONExport}
        variant="outline"
        disabled={!resume.personalInfo.fullName}
        className="flex items-center gap-2"
      >
        <FileJson className="h-4 w-4" />
        Export as JSON
      </Button>
    </div>
  );
}
