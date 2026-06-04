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

  // Dynamically build back navigation path keeping parameter tags clean
  const backPath = currentQuery ? `/jobs?q=${encodeURIComponent(currentQuery)}` : "/jobs";

  if (!job) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-muted-foreground">Analysis data profile not found.</p>
        <Button variant="outline" onClick={() => router.push(backPath)}>
          Return to Job Hunter
        </Button>
      </div>
    );
  }

  return (
    <div className="relative isolate mx-auto max-w-2xl animate-in fade-in duration-200 text-left">
      <PageLightPillars />
      <div className="relative z-10 space-y-6 rounded-[28px] border border-white/55 bg-white/38 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-6">
      
      {/* Back button preserving query parameter states */}
      <Link href={backPath} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Job List</span>
      </Link>

      <div className="flex flex-col items-start justify-between gap-4 border-b border-white/60 pb-5 sm:flex-row">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5 fill-red-500/10" />
            <span>Agent RAG Deep Alignment Audit</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-1 leading-tight">{job.role}</h1>
          <p className="text-sm font-medium text-neutral-500">{job.company}</p>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 mt-3 font-medium">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {job.salaryRange}</span>
          </div>
        </div>

        <div className={cn(
          "h-16 w-16 rounded-2xl flex flex-col items-center justify-center font-mono font-black border shadow-sm shrink-0 self-start",
          job.fitScore >= 85 ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xl" :
          job.fitScore >= 70 ? "bg-amber-50 text-amber-700 border-amber-200 text-xl" :
          "bg-rose-50 text-rose-700 border-rose-200 text-xl"
        )}>
          <span>{job.fitScore}%</span>
          <span className="text-[8px] uppercase font-sans tracking-tighter -mt-1 opacity-70">Match</span>
        </div>
      </div>

      <div className="space-y-1.5 rounded-2xl border border-white/60 bg-white/50 p-4 shadow-inner backdrop-blur-xl">
        <div className="text-xs font-bold text-neutral-800 uppercase tracking-wider">AI Verdict Score Summary</div>
        <div className="text-sm font-black text-neutral-900">&ldquo;{job.verdict}&rdquo;</div>
        <p className="text-xs leading-relaxed text-neutral-600">{job.summary}</p>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Alignment Strengths (Grounded in your CV)</span>
        </h3>
        <div className="space-y-1.5">
          {job.strengths.map((strength: string, i: number) => (
            <div key={i} className="rounded-xl border border-emerald-100/70 bg-emerald-50/45 p-3 text-xs leading-relaxed text-neutral-700 backdrop-blur">
              {strength}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>Skill Gaps & Missing Benchmark Nodes</span>
        </h3>
        <div className="space-y-1.5">
          {job.gaps.map((gap: string, i: number) => (
            <div key={i} className="rounded-xl border border-amber-100/70 bg-amber-50/45 p-3 text-xs leading-relaxed text-neutral-700 backdrop-blur">
              {gap}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-white/60 pt-4 sm:flex-row">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>Application Window Deadline: <strong className="text-neutral-700 font-semibold">{job.deadline}</strong></span>
        </div>
        
        <a
          href={job.externalUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ variant: "default" }),
            "w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6 py-2.5 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-sm"
          )}
        >
          <span>Apply on External Board</span>
          <ArrowUpRight className="h-4 w-4 shrink-0" />
        </a>
      </div>

      </div>
    </div>
  );
}

function PageLightPillars() {
  return (
    <>
      <div className="pointer-events-none absolute inset-[-6rem] z-0 overflow-hidden rounded-[40px]" aria-hidden="true">
        <div className="page-light-pillar page-light-pillar-primary absolute left-[8%] top-[-18%] h-[680px] w-44 rounded-full bg-[linear-gradient(180deg,transparent_0%,rgba(79,70,229,0.10)_12%,rgba(129,140,248,0.30)_42%,rgba(196,181,253,0.18)_70%,transparent_100%)] blur-3xl" />
        <div className="page-light-pillar page-light-pillar-secondary absolute right-[12%] top-[-20%] h-[720px] w-52 rounded-full bg-[linear-gradient(180deg,transparent_0%,rgba(196,181,253,0.12)_16%,rgba(129,140,248,0.26)_46%,rgba(79,70,229,0.14)_74%,transparent_100%)] blur-3xl" />
      </div>
      <style jsx>{`
        .page-light-pillar {
          opacity: 0.82;
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
        .page-light-pillar-primary {
          animation: page-light-pillar-primary 34s ease-in-out infinite alternate;
        }
        .page-light-pillar-secondary {
          animation: page-light-pillar-secondary 38s ease-in-out infinite alternate;
        }
        @keyframes page-light-pillar-primary {
          from { transform: translate3d(0, 0, 0) scaleY(1); }
          to { transform: translate3d(22px, 26px, 0) scaleY(1.07); }
        }
        @keyframes page-light-pillar-secondary {
          from { transform: translate3d(0, 0, 0) scaleY(1); }
          to { transform: translate3d(-24px, 30px, 0) scaleY(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .page-light-pillar {
            animation: none;
            will-change: auto;
          }
        }
      `}</style>
    </>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={<div className="text-center text-xs text-muted-foreground pt-12">Loading assessment parameters...</div>}>
      <JobDetailContent />
    </Suspense>
  );
}
