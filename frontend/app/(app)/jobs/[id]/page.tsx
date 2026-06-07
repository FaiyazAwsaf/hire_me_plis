"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  MapPin, 
  DollarSign, 
  Calendar 
} from "lucide-react";

interface JobReasoningDetail {
  role: string;
  company: string;
  location: string;
  salaryRange: string;
  deadline: string;
  fitScore: number;
  verdict: string;
  externalUrl: string;
  summary: string;
  strengths: string[];
  gaps: string[];
}

const REASONING_DETAILS_DB: Record<string, JobReasoningDetail> = {
  "job-1": {
    role: "Machine Learning Intern",
    company: "DataVanguard AI",
    location: "Gulshan, Dhaka",
    salaryRange: "৳35,000 - ৳50,000 /mo",
    deadline: "June 28, 2026",
    fitScore: 92,
    verdict: "Exceptional Match",
    externalUrl: "https://example.com/careers/ml-intern-datavanguard",
    summary: "Your profile strongly correlates with DataVanguard's core tech stack. Your research projects centered around computer vision match 90% of their operational requirements.",
    strengths: [
      "Your CV documents explicit workflow proficiency with PyTorch and computer vision layers.",
      "You reside in Dhaka, fully fulfilling their onsite availability requirement.",
      "Your academic thesis matches their active R&D focus."
    ],
    gaps: [
      "They mention exposure to Kubernetes clusters, which isn't explicitly documented inside your parsed experience nodes."
    ]
  },
  "job-2": {
    role: "Junior Data Engineer",
    company: "Bengala Tech Labs",
    location: "Banani, Dhaka",
    salaryRange: "৳60,000 - ৳80,000 /mo",
    deadline: "July 05, 2026",
    fitScore: 78,
    verdict: "Strong Core Match, Mild Skill Gaps",
    externalUrl: "https://example.com/careers/data-eng-bengala",
    summary: "Excellent database fundamentals found in your CV projects. However, you will face moderate tracking curve challenges concerning data orchestration parameters.",
    strengths: [
      "Robust indexing experience with PostgreSQL and vector embeddings found in your project block.",
      "Strong Python script design capability matching their backend framework pipelines."
    ],
    gaps: [
      "The job description requires Apache Airflow orchestrations. Your CV maps standard data loaders but no pipeline scheduler instances.",
      "Missing clear documentation regarding automated ETL pipelines."
    ]
  },
  "job-3": {
    role: "AI Developer (NLP Focused)",
    company: "NuralCorp Solutions",
    location: "Remote (Dhaka Office Base)",
    salaryRange: "৳70,000 - ৳95,000 /mo",
    deadline: "June 25, 2026",
    fitScore: 61,
    verdict: "Moderate Match (Pivot Required)",
    externalUrl: "https://example.com/careers/nlp-dev-nuralcorp",
    summary: "While you are an elite software programmer, your CV lists computer vision models, whereas this opening prioritizes Large Language Models (LLMs) and advanced fine-tuning architectures.",
    strengths: [
      "Strong implementation patterns with basic deep learning parameters.",
      "High-end Python experience handles standard optimization challenges perfectly."
    ],
    gaps: [
      "Position requires explicit experience with HuggingFace Transformer layers and LoRA fine-tuning.",
      "No historical context regarding conversational AI models or text preprocessing steps."
    ]
  }
};

function JobDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentQuery = searchParams.get("q") || "";
  const job = REASONING_DETAILS_DB[id as string];

  const backPath = currentQuery ? `/jobs?q=${encodeURIComponent(currentQuery)}` : "/jobs";

  if (!job) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#FDFBF9] flex flex-col items-center justify-center p-6 text-center">
        <p className="font-mono text-xs font-bold uppercase text-neutral-500 mb-4">Analysis data profile not found.</p>
        <Button 
          variant="outline" 
          onClick={() => router.push(backPath)}
          className="rounded-none border-2 border-black bg-white font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-50"
        >
          Return to Job Hunter
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10">
      
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

      {/* EXPANDED CONTAINER MATCHING THE DASHBOARD max-w-5xl PLANES */}
      <div className="relative z-10 mx-auto max-w-5xl animate-in fade-in duration-200 text-left">
        
        {/* MAIN WORKSPACE SHEET */}
        <div className="space-y-8 rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] sm:p-10">
          
          {/* BACK ARROW LINK */}
          <Link href={backPath} className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">
            <ArrowLeft className="h-4 w-4 stroke-[3px]" />
            <span>Back to Job List</span>
          </Link>

          {/* MAIN HEADER ROW */}
          <div className="flex flex-col items-start justify-between gap-6 border-b-2 border-black pb-6 sm:flex-row">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-xs font-black text-neutral-500 uppercase tracking-widest">
                <Sparkles className="h-4 w-4 text-black" />
                <span>Agent RAG Alignment Audit</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-black text-neutral-900 leading-tight tracking-tight">{job.role}</h1>
              <p className="font-mono text-sm font-black text-neutral-400 uppercase tracking-widest">{job.company}</p>
              
              <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs font-bold text-neutral-500 uppercase pt-2">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-black" /> {job.location}</span>
                <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-black" /> {job.salaryRange}</span>
              </div>
            </div>

            <div className={cn(
              "h-16 w-16 rounded-none flex flex-col items-center justify-center font-mono font-black border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] shrink-0 self-start text-lg",
              job.fitScore >= 85 ? "bg-emerald-50 text-emerald-900" :
              job.fitScore >= 70 ? "bg-amber-50 text-amber-900" :
              "bg-rose-50 text-rose-900"
            )}>
              <span className="leading-none">{job.fitScore}%</span>
              <span className="text-[8px] font-sans font-bold uppercase tracking-tight opacity-70 mt-0.5">Match</span>
            </div>
          </div>

          {/* VERDICT CONTAINER */}
          <div className="space-y-1.5 rounded-none border-2 border-black bg-neutral-50 p-5 md:p-6 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <div className="font-mono text-[10px] font-black text-neutral-400 uppercase tracking-wider">AI Verdict Summary</div>
            <div className="font-serif text-base md:text-lg font-black text-neutral-900">&ldquo;{job.verdict}&rdquo;</div>
            <p className="font-sans text-sm leading-relaxed text-neutral-700 mt-1.5">{job.summary}</p>
          </div>

          {/* STRENGTHS */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-black text-neutral-900 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Alignment Strengths (CV Grounded)</span>
            </h3>
            <div className="space-y-3">
              {job.strengths.map((strength: string, i: number) => (
                <div key={i} className="rounded-none border border-black bg-emerald-50/30 p-4 font-sans text-sm leading-relaxed text-neutral-800 shadow-sm">
                  {strength}
                </div>
              ))}
            </div>
          </div>

          {/* GAPS */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-black text-neutral-900 uppercase tracking-widest flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>Skill Gaps & Benchmark Deficits</span>
            </h3>
            <div className="space-y-3">
              {job.gaps.map((gap: string, i: number) => (
                <div key={i} className="rounded-none border border-black bg-amber-50/30 p-4 font-sans text-sm leading-relaxed text-neutral-800 shadow-sm">
                  {gap}
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER ACTION ROW */}
          <div className="flex flex-col items-center justify-between gap-4 border-t-2 border-black pt-6 sm:flex-row">
            <div className="font-mono text-xs text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-black" />
              <span>Window Deadline: <strong className="text-neutral-900 font-black">{job.deadline}</strong></span>
            </div>
            
            <a
              href={job.externalUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full sm:w-auto h-12 rounded-none border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 px-8 font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              )}
            >
              <span>Apply on External Board</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 stroke-[2.5px]" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#FDFBF9] flex items-center justify-center font-mono text-xs font-bold uppercase text-neutral-500">
        Loading assessment parameters...
      </div>
    }>
      <JobDetailContent />
    </Suspense>
  );
}