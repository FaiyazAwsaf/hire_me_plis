"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, MapPin, DollarSign, Calendar, BrainCircuit, ArrowRight, SlidersHorizontal } from "lucide-react";
import api from "@/lib/api";
import { useJobsStore, type JobCard } from "@/store/jobs";

function JobsSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const { results, source, isSearching, query, setResults, setSearching, setQuery } = useJobsStore();

  const [error, setError] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<"all" | "remote" | "on-site" | "hybrid">("all");

  // Filter results by location type (when backend supports it)
  const processedJobs = results.filter((job) => {
    if (locationType === "all") return true;
    // TODO: backend should filter by location_type; for now just return all
    return true;
  }).sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));

  async function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setSearching(true);

    try {
      const r = await api.post<{ results: JobCard[]; source: string; total: number }>(
        "/jobs/search",
        { query }
      );
      setResults(r.data.results, r.data.source, r.data.total);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(
        status === 404
          ? "No CV on file. Upload your CV first so fit scoring can run."
          : (detail ?? "Search failed. Please try again.")
      );
    } finally {
      setSearching(false);
    }
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

      <div className="relative z-10 mx-auto max-w-5xl animate-in fade-in duration-200 text-left">

        {/* MAIN WORKSPACE SHEET */}
        <div className="space-y-8 rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] sm:p-10">

          {/* HEADER SECTION */}
          <div className="flex flex-col gap-1 pb-6 border-b-2 border-black">
            <h1 className="font-serif text-3xl md:text-4xl font-black tracking-tight text-neutral-900">
              Job Hunter Agent
            </h1>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
              Search and evaluate roles using deep semantic intent matching against your CV.
            </p>
          </div>

          {/* --- SEARCH & FILTER BOX --- */}
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3 rounded-none border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_rgba(0,0,0,1)]">

            {/* Search Input Field */}
            <div className="flex-1 flex items-center gap-3 px-2 py-1 bg-neutral-50/50 border border-transparent focus-within:border-black transition-colors">
              <Search className="h-5 w-5 text-black shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Find me ML internships in Dhaka open this month..."
                className="flex-1 border-0 h-10 rounded-none bg-transparent font-sans text-base p-0 text-black focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-400"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Filter Dropdown */}
              <div className="relative flex items-center h-12 border border-black bg-white px-3 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-black shrink-0" />
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as any)}
                  className="font-mono text-xs font-black uppercase tracking-wider bg-transparent border-0 rounded-none h-full text-black focus:outline-none focus:ring-0 cursor-pointer pr-4"
                >
                  <option value="all">All Types</option>
                  <option value="remote">Remote</option>
                  <option value="on-site">On-Site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Action Button */}
              <Button
                type="submit"
                disabled={isSearching}
                className="h-12 rounded-none border border-primary bg-primary px-8 font-mono text-xs font-black uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSearching ? "Searching…" : "Search"}
              </Button>
            </div>
          </form>

          {/* --- RESULTS SECTION --- */}
          <div className="space-y-4 pt-2">
            {error && (
              <div className="rounded-none border border-red-300 bg-red-50 p-4 text-sm text-red-700 font-mono">
                {error}
              </div>
            )}

            {isSearching ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="rounded-none border-2 border-black animate-pulse">
                    <CardContent className="h-32" />
                  </Card>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex h-80 flex-col items-center justify-center rounded-none border border-black bg-neutral-50 p-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-none border border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <BrainCircuit className="h-6 w-6 text-black" />
                </div>
                <p className="font-serif font-black text-base text-neutral-800">
                  {query ? "No results found" : "No search initiated yet"}
                </p>
                <p className="font-sans text-xs text-neutral-500 max-w-sm mt-1.5 leading-relaxed">
                  {query
                    ? "Try a different search query"
                    : "Enter a natural-language query above to search for matching jobs."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="text-xs font-mono text-neutral-600">
                  {processedJobs.length} result{processedJobs.length !== 1 ? "s" : ""} {source && `via ${source}`}
                </div>
                {processedJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}?q=${encodeURIComponent(query)}`}
                    className="group block transform transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    <Card className="flex flex-col justify-between overflow-hidden rounded-none border-2 border-black bg-white shadow-sm transition-all duration-150 group-hover:bg-neutral-50/50 group-hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                      <CardHeader className="pb-3 pt-6 px-6 md:px-8">
                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="font-serif text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
                              {job.role}
                            </CardTitle>
                            <CardDescription className="font-mono text-xs font-black text-neutral-400 uppercase tracking-widest">
                              {job.company}
                            </CardDescription>
                          </div>

                          {/* Fit Score Badge */}
                          <div
                            className={cn(
                              "h-14 w-14 rounded-none flex flex-col items-center justify-center font-mono font-black text-base border-2 border-black shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]",
                              (job.fit_score || 0) >= 85 ? "bg-emerald-50 text-emerald-800" :
                              (job.fit_score || 0) >= 70 ? "bg-amber-50 text-amber-800" :
                              "bg-rose-50 text-rose-800"
                            )}
                          >
                            <span>{job.fit_score}%</span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-6 md:px-8 pb-6 space-y-4">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 font-mono text-xs uppercase font-bold border-t-2 border-b-2 border-black py-3 text-neutral-700 bg-neutral-50/60 px-2">
                          {job.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-black shrink-0" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          {job.salary_range && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-black shrink-0" />
                              <span>{job.salary_range}</span>
                            </div>
                          )}
                          {job.deadline && (
                            <div className="flex items-center gap-2 text-neutral-400 ml-auto">
                              <Calendar className="h-4 w-4 text-neutral-400 shrink-0" />
                              <span>{job.deadline}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs font-mono font-black uppercase tracking-wider text-black flex items-center justify-end gap-1.5 group-hover:underline pt-1">
                          <span>View details</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
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
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#FDFBF9] flex items-center justify-center font-mono text-xs font-bold uppercase text-neutral-500">
        Loading Agent…
      </div>
    }>
      <JobsSearchContent />
    </Suspense>
  );
}
