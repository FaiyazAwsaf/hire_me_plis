"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  ArrowUpRight,
  MapPin,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useJobsStore } from "@/store/jobs";

function JobDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const job = useJobsStore((s) => s.results.find((j) => j.id === id));

  if (!job) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#FDFBF9] flex flex-col items-center justify-center p-6 text-center">
        <p className="font-mono text-xs font-bold uppercase text-neutral-500 mb-4">
          Job not found. Please return to the search and try again.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/jobs")}
          className="rounded-none border-2 border-black bg-white font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-50"
        >
          Return to Job Hunter
        </Button>
      </div>
    );
  }

  const scoreColor =
    job.fit_score >= 85
      ? "bg-emerald-50 text-emerald-900"
      : job.fit_score >= 70
      ? "bg-amber-50 text-amber-900"
      : "bg-rose-50 text-rose-900";

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10">

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1A1A 1px, transparent 1px),
            linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl animate-in fade-in duration-200 text-left">
        <div className="space-y-8 rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] sm:p-10">

          {/* Back link */}
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4 stroke-[3px]" />
            <span>Back to Job List</span>
          </Link>

          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-6 border-b-2 border-black pb-6 sm:flex-row">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-xs font-black text-neutral-500 uppercase tracking-widest">
                <Sparkles className="h-4 w-4 text-black" />
                <span>AI Fit Analysis</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-black text-neutral-900 leading-tight tracking-tight">
                {job.role}
              </h1>
              <p className="font-mono text-sm font-black text-neutral-400 uppercase tracking-widest">
                {job.company}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs font-bold text-neutral-500 uppercase pt-2">
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-black" /> {job.location}
                  </span>
                )}
                {job.salary_range && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-black" /> {job.salary_range}
                  </span>
                )}
              </div>
            </div>

            <div
              className={cn(
                "h-16 w-16 rounded-none flex flex-col items-center justify-center font-mono font-black border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] shrink-0 self-start text-lg",
                scoreColor
              )}
            >
              <span className="leading-none">{job.fit_score}%</span>
              <span className="text-[8px] font-sans font-bold uppercase tracking-tight opacity-70 mt-0.5">
                Match
              </span>
            </div>
          </div>

          {/* AI reasoning */}
          <div className="space-y-1.5 rounded-none border-2 border-black bg-neutral-50 p-5 md:p-6 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <div className="font-mono text-[10px] font-black text-neutral-400 uppercase tracking-wider">
              AI Fit Reasoning
            </div>
            <p className="font-sans text-sm leading-relaxed text-neutral-800 mt-1">
              {job.fit_reasoning}
            </p>
          </div>

          {/* Footer action row */}
          <div className="flex flex-col items-center justify-between gap-4 border-t-2 border-black pt-6 sm:flex-row">
            {job.deadline && (
              <div className="font-mono text-xs text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-black" />
                <span>
                  Deadline:{" "}
                  <strong className="text-neutral-900 font-black">{job.deadline}</strong>
                </span>
              </div>
            )}
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full sm:w-auto h-12 rounded-none border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 px-8 font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              )}
            >
              <span>Apply Now</span>
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
    <Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-64px)] bg-[#FDFBF9] flex items-center justify-center font-mono text-xs font-bold uppercase text-neutral-500">
          Loading…
        </div>
      }
    >
      <JobDetailContent />
    </Suspense>
  );
}
