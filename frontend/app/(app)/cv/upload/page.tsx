"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { ArrowRight, CheckCircle2, FileText, Loader2, Upload, XCircle, Circle, Play } from "lucide-react";
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

const PROCESS_STEPS = [
  { id: 1, label: "READING RESUME", statusKey: "uploading", desc: "Parsing source file contents" },
  { id: 2, label: "EXTRACTING SKILLS", statusKey: "processing_skills", desc: "Classifying technical & soft competencies into sections" },
  { id: 3, label: "MAPPING EXPERIENCE", statusKey: "processing", desc: "Analyzing work history metrics and seniority level vectors" },
  { id: 4, label: "ANCHORING PROFILE", statusKey: "ready", desc: "Storing document matrices into the vector matching database" }
];

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [statusText, setStatusText] = useState("Choose a PDF or DOCX resume to begin.");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timerIntervalId, setTimerIntervalId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const startTimer = () => {
    if (timerIntervalId) window.clearInterval(timerIntervalId);
    setSecondsElapsed(0);
    const id = window.setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    setTimerIntervalId(id);
  };

  const stopTimer = () => {
    if (timerIntervalId) {
      window.clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
  };

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
      setCurrentStep(0);
      stopTimer();
      notify({ title: "File rejected", description: validationError, tone: "error" });
      return;
    }

    setSelectedFile(file);
    setStatus("selected");
    setStatusText("Ready to upload.");
    setCurrentStep(0);
  };

  const pollStatus = async () => {
    setCurrentStep(2); 
    
    for (let attempt = 0; attempt < 18; attempt += 1) {
      const response = await api.get<CVStatusResponse>("/cv/status");
      const cvStatus = response.data.status.toLowerCase();

      if (["ready", "completed", "embedded", "processed"].includes(cvStatus)) {
        setCurrentStep(4);
        setStatus("ready");
        stopTimer();
        setStatusText("CV embedded and ready for matching.");
        notify({ 
          title: "Resume Uploaded", 
          description: "Your resume has been proceed. Click 'Search Jobs' to find matching positions.", 
          tone: "success" 
        });
        return;
      }

      if (["failed", "error"].includes(cvStatus)) {
        setStatus("failed");
        stopTimer();
        setStatusText(response.data.error_message || "Processing failed.");
        notify({
          title: "Processing failed",
          description: response.data.error_message || "The backend could not parse this resume.",
          tone: "error",
        });
        return;
      }

      if (cvStatus === "processing" || cvStatus === "parsing" || attempt > 4) {
        setCurrentStep(3);
      }

      setStatus("processing");
      setStatusText(`Processing resume (${cvStatus})...`);
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
    }

    setStatus("processing");
    stopTimer();
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
    setCurrentStep(1);
    startTimer();

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
      stopTimer();
      setCurrentStep(0);
      setStatusText(message);
      notify({ title: "Upload failed", description: message, tone: "error" });
    }
  };

  const statusIcon = {
    idle: <Upload className="h-8 w-8 text-black" />,
    selected: <FileText className="h-8 w-8 text-black" />,
    uploading: <Loader2 className="h-8 w-8 animate-spin text-black" />,
    processing: <Loader2 className="h-8 w-8 animate-spin text-black" />,
    ready: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
    failed: <XCircle className="h-8 w-8 text-rose-600" />,
  }[status];

  const getStepState = (stepId: number) => {
    if (status === "failed") return "failed";
    if (status === "ready") return "completed";
    if (currentStep === stepId) return "active";
    if (currentStep > stepId) return "completed";
    return "pending";
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10 select-none text-left">
      
      {/* GRID CANVAS LAYER */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1A1A 1px, transparent 1px),
            linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* CORE WORKSPACE SYSTEM PANEL COMPONENT (Main outer boundary stays border-2 for hierarchy) */}
      <div className="relative z-10 mx-auto w-full max-w-3xl flex flex-col rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden p-6 space-y-6">
        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
        
        {/* Header Header */}
        <div className="flex flex-col justify-between gap-4 border-b-2 border-black pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-mono font-black uppercase tracking-wider text-black">Resume Uploader</h1>
            <p className="text-xs font-sans text-neutral-500 mt-0.5">
              Upload your existing resume to synchronize with the delivery hub pipeline.
            </p>
          </div>
          <Link href="/cv/builder">
            <Button className="flex h-10 items-center gap-2 rounded-none border border-primary bg-primary px-4 text-xs font-mono font-black uppercase text-primary-foreground shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-primary/90 transition-colors">
              <span>New Resume</span>
              <ArrowRight className="h-4 w-4 stroke-[3px]" />
            </Button>
          </Link>
        </div>

        {/* Upload Container Box (Refined to border-1) */}
        <Card className="rounded-none border border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <CardHeader className="border-b border-black bg-neutral-50 p-4">
            <CardTitle className="text-xs font-mono font-black uppercase tracking-widest text-black">Upload your CV</CardTitle>
            <CardDescription className="text-xs font-sans text-neutral-500 mt-1">
              PDF or DOCX, max 10 MB. We&apos;ll parse, classify, and embed it automatically into vectors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => handleFileSelect(event.target.files?.[0] || null)}
            />
            
            {/* Interactive Drop Box (Refined to border-1) */}
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
              className={`flex h-44 w-full items-center justify-center rounded-none border border-dashed text-center transition-all ${
                isDragging 
                  ? "border-black bg-amber-50" 
                  : "border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50 hover:border-black"
              }`}
            >
              <div className="flex flex-col items-center gap-2 px-6">
                <div className="p-2 border border-black bg-white shadow-[1px_1px_0px_rgba(0,0,0,1)] mb-1">
                  {statusIcon}
                </div>
                <span className="text-xs font-mono font-black uppercase tracking-tight text-neutral-800">
                  {selectedFile ? selectedFile.name : "Click or drag file to upload"}
                </span>
                <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">
                  [{statusText}]
                </span>
              </div>
            </button>

            {/* Inline Status Readout Info bar (Refined to border-1) */}
            <div className="flex items-center gap-2 rounded-none border border-black bg-neutral-50 p-3 text-xs font-sans font-medium text-neutral-800">
              {(status === "uploading" || status === "processing") && (
                <span className="h-2 w-2 rounded-none border border-black bg-amber-400 animate-pulse" />
              )}
              {status === "ready" && <CheckCircle2 className="h-4 w-4 text-emerald-600 stroke-[2.5px]" />}
              {status === "failed" && <XCircle className="h-4 w-4 text-rose-600 stroke-[2.5px]" />}
              {status === "idle" && <span className="h-2 w-2 rounded-none border border-black bg-neutral-400" />}
              {status === "selected" && <span className="h-2 w-2 rounded-none border border-black bg-blue-500" />}
              <span className="font-mono text-[11px] font-black uppercase tracking-tight text-black">{statusText}</span>
            </div>

            {/* Upload Button Component (Refined to border-1) */}
            <Button
              type="button"
              className="w-full h-11 rounded-none border border-primary bg-primary text-xs font-mono font-black uppercase text-primary-foreground hover:bg-primary/90 shadow-[2px_2px_0px_rgba(0,0,0,1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={!selectedFile || status === "uploading" || status === "processing"}
              onClick={handleUpload}
            >
              {status === "uploading" || status === "processing" ? "Parsing & Executing..." : "Execute Upload"}
            </Button>
          </CardContent>
        </Card>

        {/* LIVE OPERATIONAL PROCESS PIPELINE BOX (Refined container to border-1 and shadow adjusted) */}
        {(status === "uploading" || status === "processing" || status === "ready" || status === "failed") && (
          <div className="w-full rounded-none border border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] text-left animate-in fade-in zoom-in-95 duration-200">
            {/* Top Step Counter Header Row */}
            <div className="flex items-center justify-between border-b border-primary bg-primary px-4 py-2 text-[10px] font-mono font-black uppercase tracking-widest text-primary-foreground">
              <span>LIVE PIPELINE SCAN IN PROGRESS</span>
              <span>STEP {currentStep === 0 && status !== "ready" ? 1 : status === "ready" ? 4 : currentStep} OF 4</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Massive Bold Status Readout */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-neutral-400">CURRENTLY</span>
                <h3 className="text-xl font-serif font-bold text-black tracking-tight leading-tight">
                  {status === "ready" && "Profile Synced Successfully"}
                  {status === "failed" && "Pipeline Terminated"}
                  {status !== "ready" && status !== "failed" && (PROCESS_STEPS[currentStep - 1]?.label || PROCESS_STEPS[0].label)}
                </h3>
                <p className="text-xs font-sans text-neutral-500 italic">
                  {status === "ready" && "Matrix complete. Matched jobs engine synchronized."}
                  {status === "failed" && "An anomaly was detected during runtime segmentation parsing."}
                  {status !== "ready" && status !== "failed" && (PROCESS_STEPS[currentStep - 1]?.desc || PROCESS_STEPS[0].desc)}
                </p>
              </div>

              <div className="h-[2px] border-b border-neutral-200 w-full pt-1" />

              {/* 2-Column Responsive Step Progress Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-1">
                {PROCESS_STEPS.map((step) => {
                  const stepState = getStepState(step.id);
                  
                  return (
                    <div 
                      key={step.id} 
                      className={`flex items-center gap-3 py-1 border-b border-dashed border-neutral-100 transition-all duration-300 ${
                        stepState === "active" ? "opacity-100 scale-[1.01]" : 
                        stepState === "completed" ? "opacity-100" : "opacity-25"
                      }`}
                    >
                      {/* Step Checkbox Icon Container Box (Refined to border-1) */}
                      <div className={`h-6 w-6 shrink-0 flex items-center justify-center border border-black rounded-none shadow-[1px_1px_0px_rgba(0,0,0,1)] ${
                        stepState === "completed" ? "bg-primary text-primary-foreground" : "bg-white text-black"
                      }`}>
                        {stepState === "completed" && <CheckCircle2 className="h-3.5 w-3.5 stroke-[3px]" />}
                        {stepState === "active" && <Play className="h-2.5 w-2.5 fill-black" />}
                        {stepState === "failed" && step.id === currentStep && <XCircle className="h-3.5 w-3.5 text-rose-500 stroke-[3px]" />}
                        {stepState === "pending" && <span className="text-[9px] font-mono font-black">{step.id}</span>}
                      </div>

                      {/* Step Labels */}
                      <span className={`text-[11px] font-mono font-black uppercase tracking-wider ${
                        stepState === "active" || stepState === "completed" ? "text-black" : "text-neutral-400"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Terminal Footer Info Stream */}
              <div className="flex items-center gap-4 text-[10px] font-mono font-black uppercase text-neutral-400 tracking-wider pt-2 border-t border-neutral-100">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-none bg-neutral-400 inline-block animate-ping" />
                  <span className="h-1.5 w-1.5 rounded-none bg-neutral-400 inline-block" />
                  <span className="h-1.5 w-1.5 rounded-none bg-neutral-400 inline-block" />
                </div>
                <span>FILE READY FOR ENGINE MATRIX</span>
                <span>{secondsElapsed}S ELAPSED</span>
              </div>
            </div>
          </div>
        )}

        <Separator className="border-b border-black bg-transparent border-t-0 my-2" />

        {/* Documentation / Info Block (Refined to border-1) */}
        <div className="rounded-none border border-black bg-neutral-50 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-4 text-xs font-mono font-black uppercase tracking-widest text-black">Operational Framework</h2>
          <ul className="space-y-3 text-xs font-sans text-neutral-800">
            <li className="flex gap-3 items-start">
              <Badge className="font-mono text-[10px] font-black bg-white border border-black text-black px-1.5 py-0 rounded-none shadow-[1px_1px_0px_rgba(0,0,0,1)] shrink-0">1</Badge>
              <span>Upload your resume PDF or DOCX framework file stream.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Badge className="font-mono text-[10px] font-black bg-white border border-black text-black px-1.5 py-0 rounded-none shadow-[1px_1px_0px_rgba(0,0,0,1)] shrink-0">2</Badge>
              <span>Systems parse and index target classifications into mapped data sections.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Badge className="font-mono text-[10px] font-black bg-white border border-black text-black px-1.5 py-0 rounded-none shadow-[1px_1px_0px_rgba(0,0,0,1)] shrink-0">3</Badge>
              <span>Content is converted to vectors and stored securely inside the primary embedding matrix database.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Badge className="font-mono text-[10px] font-black bg-white border border-black text-black px-1.5 py-0 rounded-none shadow-[1px_1px_0px_rgba(0,0,0,1)] shrink-0">4</Badge>
              <span>Your career profile anchors directly to automated AI matcher pipelines and metrics.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}