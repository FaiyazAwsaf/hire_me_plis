"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, MapPin, DollarSign, Calendar, BrainCircuit, ArrowRight, CheckSquare, Square, AlertCircle, Upload } from "lucide-react";
import api from "@/lib/api";
import { useJobsStore, type JobCard } from "@/store/jobs";

function JobsSearchContent() {
  const { results, isSearching, query, setResults, setSearching, setQuery } = useJobsStore();

  const [error, setError] = useState<string | null>(null);
  const [hasCv, setHasCv] = useState<boolean | null>(null); // null = checking, false = missing, true = present
  
  // Track specific checklist items from Screenshot 2026-06-08 013036.png
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const workflowSteps = [
    { label: "READING RESUME", subtext: "Parsing files into target index arrays" },
    { label: "EXTRACTING SKILLS", subtext: "Isolating verified domain tools and profiles" },
    { label: "MAPPING EXPERIENCE", subtext: "Analyzing work history and seniority level" },
    { label: "QUERYING WORKSPACES", subtext: "Running deep natural-language vectors" },
    { label: "FILTERING RESULTS", subtext: "Applying target coordinates and boundaries" },
    { label: "RANKING MATCHES", subtext: "Evaluating semantic model fit score weights" }
  ];

  // Proactively check CV status on initialization before searching
  useEffect(() => {
    async function checkCvPresence() {
      try {
        const response = await api.get<{ status: string }>("/cv/status");
        const cvStatus = response.data.status.toLowerCase();
        
        if (cvStatus === "done") {
          setHasCv(true);
        } else {
          setHasCv(false);
          setError("No CV on file. Upload your CV first so fit scoring can run.");
        }
      } catch (err) {
        // If 404 error code drops or fails, we infer no CV exists
        setHasCv(false);
        setError("No CV on file. Upload your CV first so fit scoring can run.");
      }
    }
    checkCvPresence();
  }, []);

  // Logic timers mirroring live progress dashboard parameters
  useEffect(() => {
    let workflowInterval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    if (isSearching) {
      setCurrentStep(0);
      setElapsedTime(0);

      // Increment elapsed time counter every second
      timerInterval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Transition across pipeline steps sequentially
      workflowInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < workflowSteps.length - 1) return prev + 1;
          return prev; // Stay on final step until API returns data
        });
      }, 800);
    }

    return () => {
      clearInterval(workflowInterval);
      clearInterval(timerInterval);
    };
  }, [isSearching]);

  const processedJobs = [...results].sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));

  async function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Block searching if we already determined the CV is missing
    if (hasCv === false) {
      setError("No CV on file. Upload your CV first so fit scoring can run.");
      return;
    }

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
      
      if (status === 404) {
        setHasCv(false);
        setError("No CV on file. Upload your CV first so fit scoring can run.");
      } else {
        setError(detail ?? "Search failed. Please try again.");
      }
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

          {/* PRE-SEARCH CV CHECK WARNING BOX */}
          {hasCv === false && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-none border-2 border-black bg-amber-50 p-4 shadow-[3px_3px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-mono text-xs font-black uppercase text-neutral-900">Missing CV</p>
                  <p className="font-sans text-xs text-neutral-600">Upload a resume before searching for jobs.</p>
                </div>
              </div>
              <Link href="/cv/upload">
                <Button className="h-9 rounded-none border border-black bg-black px-4 font-mono text-[11px] font-black uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Resume</span>
                </Button>
              </Link>
            </div>
          )}

          {/* --- SEARCH BOX --- */}
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3 rounded-none border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            <div className="flex-1 flex items-center gap-3 px-2 py-1 bg-neutral-50/50 border border-transparent focus-within:border-black transition-colors">
              <Search className="h-5 w-5 text-black shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={hasCv === false}
                placeholder={hasCv === false ? "Please upload your CV first..." : "e.g., Find me ML internships in Dhaka open this month..."}
                className="flex-1 border-0 h-10 rounded-none bg-transparent font-sans text-base p-0 text-black focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-400 disabled:cursor-not-allowed"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching || hasCv === false}
              className="h-12 rounded-none border border-black bg-black px-8 font-mono text-xs font-black uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              {isSearching ? "Searching…" : "Search"}
            </Button>
          </form>

          {/* --- RESULTS AREA --- */}
          <div className="space-y-4 pt-2">
            {error && hasCv !== false && (
              <div className="rounded-none border-2 border-black bg-rose-50 p-4 text-sm text-rose-900 font-mono font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {error}
              </div>
            )}

            {isSearching ? (
              /* RESTORED SPLIT SCREEN CHEKLIST LOADER PANEL FROM SCREENSHOT */
              <div className="w-full border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
                
                {/* Loader Header Ticker Banner */}
                <div className="bg-black text-white px-4 py-2.5 flex justify-between items-center font-mono text-[10px] tracking-widest uppercase font-black">
                  <span>Live Search in Progress</span>
                  <span className="text-neutral-400">Step {currentStep + 1} of {workflowSteps.length}</span>
                </div>

                {/* Progress Bar Line */}
                <div className="w-full bg-neutral-200 h-1.5 border-b border-black">
                  <div 
                    className="bg-black h-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / workflowSteps.length) * 100}%` }}
                  />
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {/* Current Stage Large Headline readout */}
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase font-black tracking-widest text-neutral-400 block">Currently</span>
                    <h2 className="font-serif text-2xl md:text-3xl font-black text-neutral-900 tracking-tight capitalize">
                      {workflowSteps[currentStep].label.toLowerCase()}
                    </h2>
                    <p className="font-sans text-xs text-neutral-500 font-medium">
                      {workflowSteps[currentStep].subtext}
                    </p>
                  </div>

                  <hr className="border-neutral-200" />

                  {/* Dual Grid Pipeline Status Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {workflowSteps.map((step, idx) => {
                      const isCompleted = idx < currentStep;
                      const isActive = idx === currentStep;
                      
                      return (
                        <div 
                          key={step.label}
                          className={cn(
                            "flex items-center gap-3 py-2 border-b border-neutral-100 transition-all duration-150",
                            isCompleted && "opacity-80",
                            isActive && "border-b-black bg-neutral-50 px-2",
                            !isActive && !isCompleted && "opacity-25"
                          )}
                        >
                          {isCompleted ? (
                            <CheckSquare className="h-4 w-4 text-black shrink-0 fill-neutral-900 text-white" />
                          ) : isActive ? (
                            <div className="h-4 w-4 border-2 border-black bg-white flex items-center justify-center shrink-0">
                              <div className="h-1.5 w-1.5 bg-black animate-pulse" />
                            </div>
                          ) : (
                            <Square className="h-4 w-4 text-neutral-400 shrink-0" />
                          )}
                          
                          <span className={cn(
                            "font-mono text-xs tracking-wider",
                            isActive ? "font-black text-black" : "font-bold text-neutral-800"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dashboard Metrics footer data readout */}
                  <div className="pt-4 flex items-center gap-6 border-t-2 border-dashed border-neutral-200 font-mono text-[10px] uppercase font-black text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-black animate-ping" />
                      <span className="text-black">Evaluating matching index clusters</span>
                    </div>
                    <div>{elapsedTime}s elapsed</div>
                  </div>

                </div>
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
                {processedJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
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