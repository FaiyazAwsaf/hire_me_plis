"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, MapPin, DollarSign, Calendar, BrainCircuit, ArrowRight } from "lucide-react";

// Added fitScore back to database definitions
export const MOCK_JOBS_DATABASE = [
  {
    id: "job-1",
    role: "Machine Learning Intern",
    company: "DataVanguard AI",
    salaryRange: "৳35,000 - ৳50,000 /mo",
    deadline: "June 28, 2026",
    location: "Gulshan, Dhaka",
    fitScore: 92,
  },
  {
    id: "job-2",
    role: "Junior Data Engineer",
    company: "Bengala Tech Labs",
    salaryRange: "৳60,000 - ৳80,000 /mo",
    deadline: "July 05, 2026",
    location: "Banani, Dhaka",
    fitScore: 78,
  },
  {
    id: "job-3",
    role: "AI Developer (NLP Focused)",
    company: "NuralCorp Solutions",
    salaryRange: "৳70,000 - ৳95,000 /mo",
    deadline: "June 25, 2026",
    location: "Remote (Dhaka Office Base)",
    fitScore: 61,
  }
];

function JobsSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const urlQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(urlQuery);
  const [isSearched, setIsSearched] = useState(!!urlQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearched(true);
    router.push(`/jobs?q=${encodeURIComponent(query.trim())}`);
  };

  // Sort array dynamically so highest fitScore is always rendered first
  const sortedJobs = [...MOCK_JOBS_DATABASE].sort((a, b) => b.fitScore - a.fitScore);

  return (
    <div className="relative isolate mx-auto max-w-2xl min-h-[calc(100vh-theme(spacing.16))] text-left">
      <PageLightPillars />
      <div className="relative z-10 space-y-6 rounded-[28px] border border-white/55 bg-white/38 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">Job Hunter Agent</h1>
        <p className="text-sm text-muted-foreground"></p>
      </div>

      {/* --- SEMANTIC NATURAL LANGUAGE SEARCH BAR --- */}
      <form onSubmit={handleSearch} className="flex gap-2 rounded-2xl border border-white/60 bg-white/58 p-1.5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Find me ML internships in Dhaka open this month..." 
            className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
          />
        </div>
        <Button type="submit" className="rounded-xl bg-slate-900 px-5 font-medium text-white hover:bg-slate-800">
          Search Agent
        </Button>
      </form>

      {/* --- COLUMN LAYOUT FOR SORTED JOB CARDS --- */}
      <div className="space-y-4">
        {!isSearched ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/42 p-6 text-center shadow-inner backdrop-blur-xl">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/55 shadow-sm">
              <BrainCircuit className="h-5 w-5 text-[#4F46E5]" />
            </div>
            <p className="font-semibold text-neutral-800 text-sm">No agent search initiated yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enter a natural-language intent request above to crawl matching local openings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-in fade-in duration-300">
            {sortedJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}?q=${encodeURIComponent(query)}`} className="block group">
                <Card className="overflow-hidden rounded-2xl border border-white/60 bg-white/58 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/68 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base font-bold text-neutral-900 group-hover:text-red-500 transition-colors">
                          {job.role}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-neutral-500 mt-0.5">
                          {job.company}
                        </CardDescription>
                      </div>

                      {/* Clean Fit Score Display Badge */}
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex flex-col items-center justify-center font-mono font-black text-xs border shrink-0 shadow-sm",
                        job.fitScore >= 85 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        job.fitScore >= 70 ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-rose-50 text-rose-700 border-rose-200"
                      )}>
                        <span>{job.fitScore}%</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="text-xs text-muted-foreground px-5 pb-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-medium border-t border-b border-muted/60 py-2 text-neutral-600/90">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        <span>{job.salaryRange}</span>
                      </div>
                      <div className="flex items-center gap-1 text-neutral-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Deadline: {job.deadline}</span>
                      </div>
                    </div>
                    
                    <div className="text-[11px] text-red-500 font-bold flex items-center justify-end gap-1 group-hover:underline">
                      <span>View agent assessment details</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="text-center text-xs text-muted-foreground pt-12">Loading Agent Index...</div>}>
      <JobsSearchContent />
    </Suspense>
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
