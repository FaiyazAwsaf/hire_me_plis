"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Send, 
  Cpu, 
  Milestone, 
  Flame, 
  Sparkles, 
  KanbanSquare,
  CalendarDays,
  ArrowUpRight
} from "lucide-react";

const WEEKLY_STATS_MOCK = {
  applicationsSent: 6,
  skillsAdded: 4,
  roadmapCompletePercentage: 72,
  streakDays: 5,
};

const TRACKER_PREVIEW_MOCK = {
  kanbanStagesCount: { applied: 1, interviewing: 0, offer: 0, rejected: 0 },
  upcomingDeadlines: [
    { text: "Finish DSA course", date: "June 5", category: "learning" },
    { text: "Update resume layout", date: "June 7", category: "cv" }
  ],
};

export default function DashboardPage() {
  return (
    <div className="relative isolate mx-auto max-w-5xl animate-in fade-in duration-200 text-left">
      <div className="pointer-events-none absolute inset-[-7rem] z-0 overflow-hidden rounded-[40px]" aria-hidden="true">
        <div className="dashboard-light-pillar dashboard-light-pillar-primary absolute left-[12%] top-[-18%] h-[760px] w-48 rounded-full bg-[linear-gradient(180deg,transparent_0%,rgba(79,70,229,0.10)_12%,rgba(129,140,248,0.34)_42%,rgba(196,181,253,0.20)_70%,transparent_100%)] blur-3xl" />
        <div className="dashboard-light-pillar dashboard-light-pillar-secondary absolute left-[48%] top-[-22%] h-[820px] w-56 rounded-full bg-[linear-gradient(180deg,transparent_0%,rgba(196,181,253,0.12)_16%,rgba(129,140,248,0.30)_46%,rgba(79,70,229,0.16)_74%,transparent_100%)] blur-3xl" />
        <div className="dashboard-light-pillar dashboard-light-pillar-tertiary absolute right-[8%] top-[-16%] h-[720px] w-44 rounded-full bg-[linear-gradient(180deg,transparent_0%,rgba(129,140,248,0.11)_14%,rgba(196,181,253,0.28)_50%,rgba(79,70,229,0.12)_78%,transparent_100%)] blur-3xl" />
        <div className="absolute inset-x-12 top-24 h-72 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,181,253,0.24),rgba(129,140,248,0.10)_42%,transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 space-y-6 rounded-[28px] border border-white/55 bg-white/38 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1 pb-2">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">
          Progress Dashboard
        </h1>
        <p className="text-xs text-neutral-500">
          Overview of your active job application workflows, daily milestones, and automated insights.
        </p>
      </div>

      {/* MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- TOP LEFT: METRICS GRID CONTAINER --- */}
        <div className="grid h-[280px] grid-cols-2 gap-4 rounded-2xl border border-white/60 bg-white/42 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <MiniStatCard 
            title="Applications" 
            value={WEEKLY_STATS_MOCK.applicationsSent.toString()} 
            badge="this week" 
            icon={<Send className="h-3.5 w-3.5 text-neutral-500" />}
            description="Target: 10 sent"
          />
          
          <MiniStatCard 
            title="Skills Added" 
            value={`+${WEEKLY_STATS_MOCK.skillsAdded}`} 
            badge="verified" 
            icon={<Cpu className="h-3.5 w-3.5 text-emerald-600" />}
            description="Parsed profile updates"
          />
          
          <MiniStatCard 
            title="Roadmap" 
            value={`${WEEKLY_STATS_MOCK.roadmapCompletePercentage}%`} 
            badge="progress" 
            icon={<Milestone className="h-3.5 w-3.5 text-blue-600" />}
            description="Milestone 3 target"
          />
          
          <MiniStatCard 
            title="Streak" 
            value={`${WEEKLY_STATS_MOCK.streakDays} Days`} 
            badge="active" 
            icon={<Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500/10" />}
            description="Actions logged daily"
          />
        </div>

        {/* --- TOP RIGHT: AI NUDGE FEED PANEL (EXCHANGED) --- */}
        <Card className="flex h-[280px] flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-white/58 shadow-[0_18px_55px_rgba(15,23,42,0.09)] backdrop-blur-xl">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center gap-2">
              <div className="rounded-md border border-white/60 bg-white/55 p-1 shadow-sm">
                <Sparkles className="h-4 w-4 text-[#4F46E5] fill-[#818CF8]/10" />
              </div>
              <CardTitle className="text-sm font-bold text-neutral-900">AI Nudge System</CardTitle>
            </div>
            <CardDescription className="text-xs text-neutral-400">
              Automated notifications evaluated against active workspace speeds.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex-1 flex items-center justify-center">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-white/60 bg-white/38 p-4 text-center shadow-inner">
              <p className="text-xs font-bold text-neutral-700">No warnings flags triggered</p>
              <p className="text-[11px] text-neutral-400 max-w-xs mt-1">
                Expand your core index metrics to unlock predictive semantic tracking signals.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* --- BOTTOM LEFT: KANBAN BOARD PREVIEW PANEL (EXCHANGED) --- */}
        <Link href="/tracker?view=kanban" className="group block h-[340px]">
          <Card className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-white/58 shadow-[0_18px_55px_rgba(15,23,42,0.09)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/68 hover:shadow-[0_24px_65px_rgba(15,23,42,0.13)]">
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="rounded-md border border-white/60 bg-white/55 p-1 shadow-sm">
                  <KanbanSquare className="h-4 w-4 text-[#4F46E5] shrink-0" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-neutral-900">Kanban Board</CardTitle>
                  <CardDescription className="text-[11px] text-neutral-400">Pipeline mapping active roles</CardDescription>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </CardHeader>
            <CardContent className="px-5 pb-5 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-4 gap-2 rounded-xl border border-white/60 bg-white/42 p-4 text-center shadow-inner">
                <div className="space-y-0.5">
                  <div className="text-base font-mono font-black text-neutral-800">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.applied}</div>
                  <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Applied</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-base font-mono font-medium text-neutral-400">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.interviewing}</div>
                  <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Interview</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-base font-mono font-medium text-neutral-400">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.offer}</div>
                  <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Offer</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-base font-mono font-medium text-neutral-400">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.rejected}</div>
                  <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* --- BOTTOM RIGHT: PRETTY SCROLLABLE CALENDAR PANEL --- */}
        <Link href="/tracker?view=calendar" className="group block h-[340px]">
          <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/58 shadow-[0_18px_55px_rgba(15,23,42,0.09)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/68 hover:shadow-[0_24px_65px_rgba(15,23,42,0.13)]">
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0 shrink-0">
              <div className="flex items-center gap-2">
                <div className="rounded-md border border-white/60 bg-white/55 p-1 shadow-sm">
                  <CalendarDays className="h-4 w-4 text-[#4F46E5] shrink-0" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-neutral-900">Calendar & Agenda</CardTitle>
                    <span className="rounded border border-white/60 bg-white/55 px-1.5 py-0.5 font-mono text-[10px] font-bold text-neutral-600 shadow-sm">June 2026</span>
                  </div>
                  <CardDescription className="text-[11px] text-neutral-400">Scroll layout showing due parameters</CardDescription>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </CardHeader>
            
            {/* Scrollable Container Box with Elegant Scroll Styling */}
            <CardContent className="px-5 pb-5 overflow-y-auto flex-1 pr-3 mr-1 space-y-4 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent hover:scrollbar-thumb-neutral-300 transition-colors">
              <div>
                {/* Day Titles */}
                <div className="sticky top-0 z-10 mb-2 grid grid-cols-7 gap-1.5 bg-white/75 pt-1 pb-1 text-center text-[9px] font-black uppercase tracking-wider text-neutral-400 backdrop-blur">
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                
                {/* Interactive Matrix Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                    const isDSA = day === 5;
                    const isCV = day === 7;
                    
                    return (
                      <div 
                        key={day} 
                        className={cn(
                          "p-1.5 h-12 border rounded-xl text-[10px] font-bold flex flex-col justify-between transition-colors relative group/day overflow-hidden",
                          isDSA ? 'border-blue-200 bg-blue-50/60 text-blue-700' : 
                          isCV ? 'border-red-200 bg-red-50/60 text-red-600' : 
                          'border-neutral-100 bg-neutral-50/30 text-neutral-700 hover:bg-neutral-50'
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span>{day}</span>
                          {isDSA && <span className="h-1 w-1 bg-blue-600 rounded-full block animate-pulse" />}
                          {isCV && <span className="h-1 w-1 bg-red-500 rounded-full block animate-pulse" />}
                        </div>

                        {isDSA && (
                          <span className="text-[7px] leading-tight text-blue-800 font-bold uppercase tracking-tight truncate block">
                            DSA Due
                          </span>
                        )}
                        {isCV && (
                          <span className="text-[7px] leading-tight text-red-700 font-bold uppercase tracking-tight truncate block">
                            CV Update
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

      </div>
      </div>
      <style jsx>{`
        .dashboard-light-pillar {
          opacity: 0.88;
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }

        .dashboard-light-pillar-primary {
          animation: dashboard-light-pillar-primary 32s ease-in-out infinite alternate;
        }

        .dashboard-light-pillar-secondary {
          animation: dashboard-light-pillar-secondary 38s ease-in-out infinite alternate;
        }

        .dashboard-light-pillar-tertiary {
          animation: dashboard-light-pillar-tertiary 34s ease-in-out infinite alternate;
        }

        @keyframes dashboard-light-pillar-primary {
          from {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          to {
            transform: translate3d(24px, 28px, 0) scaleY(1.08);
          }
        }

        @keyframes dashboard-light-pillar-secondary {
          from {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          to {
            transform: translate3d(-26px, 34px, 0) scaleY(1.06);
          }
        }

        @keyframes dashboard-light-pillar-tertiary {
          from {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          to {
            transform: translate3d(-20px, 24px, 0) scaleY(1.05);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-light-pillar {
            animation: none;
            will-change: auto;
          }
        }
      `}</style>
    </div>
  );
}

{/* REUSABLE INTERNAL COMPACT MICRO-METRIC CARD */}
interface MiniStatCardProps {
  title: string;
  value: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
}

function MiniStatCard({ title, value, badge, icon, description }: MiniStatCardProps) {
  return (
    <Card className="flex flex-col justify-between space-y-2 rounded-xl border border-white/60 bg-white/58 p-3.5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase truncate">
          {title}
        </span>
        <div className="shrink-0 rounded-md border border-white/60 bg-white/55 p-1 shadow-sm">
          {icon}
        </div>
      </div>
      
      <div className="space-y-0.5">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="text-lg font-black text-neutral-900 tracking-tight">
            {value}
          </span>
          <Badge variant="secondary" className="rounded border border-[#C4B5FD]/35 bg-white/55 px-1 py-0 font-mono text-[8px] font-bold uppercase tracking-wider text-[#4F46E5] shadow-sm">
            {badge}
          </Badge>
        </div>
        <p className="text-[10px] text-neutral-400 font-medium truncate">
          {description}
        </p>
      </div>
    </Card>
  );
}
