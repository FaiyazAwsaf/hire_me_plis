"use client";

import React, { useState, useEffect, Suspense } from "react";
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

  useEffect(() => {
    setQuery(urlQuery);
    setIsSearched(!!urlQuery);
  }, [urlQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearched(true);
    router.push(`/jobs?q=${encodeURIComponent(query.trim())}`);
  };

  // Sort array dynamically so highest fitScore is always rendered first
  const sortedJobs = [...MOCK_JOBS_DATABASE].sort((a, b) => b.fitScore - a.fitScore);

  return (
    <div className="space-y-6 max-w-2xl mx-auto min-h-[calc(100vh-theme(spacing.16))] text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">Job Hunter Agent</h1>
        <p className="text-sm text-muted-foreground">Pillar 1: Semantic job tracking matched directly against your CV index.</p>
      </div>

      {/* --- SEMANTIC NATURAL LANGUAGE SEARCH BAR --- */}
      <form onSubmit={handleSearch} className="flex gap-2 bg-white p-1.5 rounded-2xl border shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Find me ML internships in Dhaka open this month..." 
            className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
          />
        </div>
        <Button type="submit" className="bg-black hover:bg-neutral-800 text-white rounded-xl px-5 font-medium">
          Search Agent
        </Button>
      </form>

      {/* --- COLUMN LAYOUT FOR SORTED JOB CARDS --- */}
      <div className="space-y-4">
        {!isSearched ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 h-64 text-center p-6 bg-muted/20">
            <BrainCircuit className="h-5 w-5 text-red-500 animate-pulse mb-2" />
            <p className="font-semibold text-neutral-800 text-sm">No agent search initiated yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enter a natural-language intent request above to crawl matching local openings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-in fade-in duration-300">
            {sortedJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}?q=${encodeURIComponent(query)}`} className="block group">
                <Card className="transition-all duration-200 border bg-white rounded-xl overflow-hidden hover:border-neutral-400 hover:shadow-sm">
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
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="text-center text-xs text-muted-foreground pt-12">Loading Agent Index...</div>}>
      <JobsSearchContent />
    </Suspense>
  );
}