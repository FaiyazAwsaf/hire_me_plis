"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { ArrowRight, CheckCircle2, FileText, Loader2, Upload, XCircle } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToastMessage, ToastViewport } from "@/components/ui/toast";

type UploadStatus = "idle" | "selected" | "uploading" | "processing" | "ready" | "failed";

interface CVStatusResponse {
  cv_id: string;
  status: string;
  error_message?: string | null;
}

const maxFileBytes = 10 * 1024 * 1024;
const acceptedExtensions = [".pdf", ".docx"];

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [statusText, setStatusText] = useState("Choose a PDF or DOCX resume to begin.");
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  };

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const validateFile = (file: File) => {
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = acceptedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!hasAllowedExtension) {
      return "Only PDF and DOCX files are accepted.";
    }

    if (file.size > maxFileBytes) {
      return "Resume files must be 10 MB or smaller.";
    }

    return "";
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setSelectedFile(null);
      setStatus("failed");
      setStatusText(validationError);
      notify({ title: "File rejected", description: validationError, tone: "error" });
      return;
    }

    setSelectedFile(file);
    setStatus("selected");
    setStatusText("Ready to upload.");
  };

  const pollStatus = async () => {
    for (let attempt = 0; attempt < 18; attempt += 1) {
      const response = await api.get<CVStatusResponse>("/cv/status");
      const cvStatus = response.data.status.toLowerCase();

      if (["ready", "completed", "embedded", "processed"].includes(cvStatus)) {
        setStatus("ready");
        setStatusText("CV embedded and ready for matching.");
        notify({ title: "Resume processed", description: "Your CV is ready for insights.", tone: "success" });
        return;
      }

      if (["failed", "error"].includes(cvStatus)) {
        setStatus("failed");
        setStatusText(response.data.error_message || "Processing failed.");
        notify({
          title: "Processing failed",
          description: response.data.error_message || "The backend could not parse this resume.",
          tone: "error",
        });
        return;
      }

      setStatus("processing");
      setStatusText(`Processing resume (${cvStatus})...`);
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
    }

    setStatus("processing");
    setStatusText("Still processing. You can leave this page and check back later.");
    notify({
      title: "Still processing",
      description: "The upload succeeded, but parsing has not finished yet.",
      tone: "info",
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      notify({ title: "Choose a resume first", tone: "info" });
      return;
    }

    setStatus("uploading");
    setStatusText("Uploading resume...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await api.post("/cv/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus("processing");
      setStatusText("Upload complete. Parsing and embedding...");
      notify({ title: "Upload started", description: "Parsing and embedding are now running.", tone: "success" });
      await pollStatus();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      const message = axiosError.response?.data?.detail || "Could not upload the resume. Check your backend and login session.";
      setStatus("failed");
      setStatusText(message);
      notify({ title: "Upload failed", description: message, tone: "error" });
    }
  };

  const statusIcon = {
    idle: <Upload className="h-8 w-8" />,
    selected: <FileText className="h-8 w-8" />,
    uploading: <Loader2 className="h-8 w-8 animate-spin" />,
    processing: <Loader2 className="h-8 w-8 animate-spin" />,
    ready: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
    failed: <XCircle className="h-8 w-8 text-red-600" />,
  }[status];

  return (
    <div className="max-w-3xl space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resume Uploader</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Upload your existing resume to get started
          </p>
        </div>
        <Link href="/cv/builder">
          <Button className="flex items-center gap-2">
            New Resume
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload your CV</CardTitle>
          <CardDescription>
            PDF or DOCX, max 10 MB. We&apos;ll parse, classify, and embed it automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => handleFileSelect(event.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFileSelect(event.dataTransfer.files?.[0] || null);
            }}
            className={`flex h-40 w-full items-center justify-center rounded-lg border border-dashed text-center transition-colors ${
              isDragging ? "border-neutral-900 bg-neutral-100" : "border-neutral-300 bg-muted/20 hover:bg-muted/40"
            }`}
          >
            <div className="flex flex-col items-center gap-2 px-6 text-muted-foreground">
              {statusIcon}
              <span className="text-sm font-medium text-neutral-800">
                {selectedFile ? selectedFile.name : "Click or drag to upload"}
              </span>
              <span className="text-xs">{statusText}</span>
            </div>
          </button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {(status === "uploading" || status === "processing") && (
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
            )}
            {status === "ready" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            {status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
            <span>{statusText}</span>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!selectedFile || status === "uploading" || status === "processing"}
            onClick={handleUpload}
          >
            {status === "uploading" || status === "processing" ? "Working..." : "Upload"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="mb-4 font-semibold">How it works</h2>
        <ul className="space-y-3 text-sm text-neutral-700">
          <li className="flex gap-3">
            <Badge variant="outline" className="mt-1 shrink-0">1</Badge>
            <span>Upload your resume PDF or DOCX file</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="mt-1 shrink-0">2</Badge>
            <span>We parse and classify it into sections</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="mt-1 shrink-0">3</Badge>
            <span>Content is embedded and stored in our vector database</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="mt-1 shrink-0">4</Badge>
            <span>Your resume is ready for AI-powered matching and insights</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
