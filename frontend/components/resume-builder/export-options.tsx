"use client";

import React from "react";
import { Resume, ResumeTemplateId } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Download, FileJson } from "lucide-react";
import { generateResumeHTML, downloadJSON } from "@/lib/resume/utils";
import { ToastMessage } from "@/components/ui/toast";

interface ExportOptionsProps {
  resume: Resume;
  templateId: ResumeTemplateId;
  onNotify: (toast: Omit<ToastMessage, "id">) => void;
}

/**
 * ExportOptions Component
 * Provides export functionality for resume
 * Supports PDF and JSON export
 */
export function ExportOptions({ resume, templateId, onNotify }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      const html = generateResumeHTML({ ...resume, templateId }, templateId);
      const iframe = document.createElement("iframe");

      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.setAttribute("aria-hidden", "true");
      document.body.appendChild(iframe);

      const printDocument = iframe.contentDocument;
      const printWindow = iframe.contentWindow;

      if (!printDocument || !printWindow) {
        throw new Error("Unable to prepare the PDF export surface.");
      }

      printDocument.open();
      printDocument.write(html);
      printDocument.close();

      await new Promise((resolve) => window.setTimeout(resolve, 150));
      printWindow.focus();
      printWindow.print();

      window.setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      onNotify({
        title: "PDF export ready",
        description: "Use your browser's save as PDF option. The resume layout is sized to one A4 page without browser metadata.",
        tone: "success",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      onNotify({
        title: "Failed to export PDF",
        description: "Please try again after saving the resume.",
        tone: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleJSONExport = () => {
    downloadJSON(resume);
    onNotify({ title: "JSON exported", tone: "success" });
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
