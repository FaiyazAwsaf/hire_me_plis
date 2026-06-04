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
        <div className="dashboard-aurora dashboard-aurora-blue absolute -right-12 top-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.75),rgba(147,197,253,0.56)_42%,transparent_70%)] blur-3xl" />
        <div className="dashboard-aurora dashboard-aurora-violet absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(196,181,253,0.82),rgba(221,214,254,0.62)_45%,transparent_72%)] blur-3xl" />
        <div className="dashboard-aurora dashboard-aurora-slate absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(226,232,240,0.86),rgba(186,230,253,0.62)_48%,transparent_72%)] blur-3xl" />
      </div>

      <div className="relative z-10 space-y-6 rounded-[28px] border border-white/55 bg-white/35 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
      
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
        <div className="bg-neutral-50/60 border border-neutral-200/60 rounded-2xl p-5 grid grid-cols-2 gap-4 h-[280px]">
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
        <Card className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm overflow-hidden flex flex-col justify-between h-[280px]">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-neutral-100 rounded-md">
                <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500/10" />
              </div>
              <CardTitle className="text-sm font-bold text-neutral-900">AI Nudge System</CardTitle>
            </div>
            <CardDescription className="text-xs text-neutral-400">
              Automated notifications evaluated against active workspace speeds.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 flex-1 flex items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 p-4">
              <p className="text-xs font-bold text-neutral-700">No warnings flags triggered</p>
              <p className="text-[11px] text-neutral-400 max-w-xs mt-1">
                Expand your core index metrics to unlock predictive semantic tracking signals.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* --- BOTTOM LEFT: KANBAN BOARD PREVIEW PANEL (EXCHANGED) --- */}
        <Link href="/tracker?view=kanban" className="group block h-[340px]">
          <Card className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm hover:border-neutral-400 hover:shadow transition-all duration-200 flex flex-col justify-between h-full overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-neutral-100 rounded-md">
                  <KanbanSquare className="h-4 w-4 text-blue-500 shrink-0" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-neutral-900">Kanban Board</CardTitle>
                  <CardDescription className="text-[11px] text-neutral-400">Pipeline mapping active roles</CardDescription>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </CardHeader>
            <CardContent className="px-5 pb-5 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-4 gap-2 text-center bg-neutral-50/70 p-4 border border-neutral-200/50 rounded-xl">
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
          <Card className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm hover:border-neutral-400 hover:shadow transition-all duration-200 flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-neutral-100 rounded-md">
                  <CalendarDays className="h-4 w-4 text-indigo-500 shrink-0" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-neutral-900">Calendar & Agenda</CardTitle>
                    <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">June 2026</span>
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
                <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-black uppercase text-neutral-400 mb-2 tracking-wider sticky top-0 bg-white pt-1 pb-1 z-10">
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
        .dashboard-aurora {
          opacity: 0.84;
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }

        .dashboard-aurora-blue {
          animation: dashboard-aurora-blue 34s ease-in-out infinite alternate;
        }

        .dashboard-aurora-violet {
          animation: dashboard-aurora-violet 42s ease-in-out infinite alternate;
        }

        .dashboard-aurora-slate {
          animation: dashboard-aurora-slate 38s ease-in-out infinite alternate;
        }

        @keyframes dashboard-aurora-blue {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(-38px, 32px, 0) scale(1.08);
          }
        }

        @keyframes dashboard-aurora-violet {
          from {
            transform: translate3d(-50%, -50%, 0) scale(1);
          }
          to {
            transform: translate3d(calc(-50% + 28px), calc(-50% - 22px), 0) scale(1.08);
          }
        }

        @keyframes dashboard-aurora-slate {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(26px, 20px, 0) scale(1.04);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-aurora {
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
    <Card className="bg-white border border-neutral-200/80 rounded-xl shadow-sm flex flex-col justify-between p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase truncate">
          {title}
        </span>
        <div className="p-1 bg-neutral-50 border border-neutral-100 rounded-md shrink-0">
          {icon}
        </div>
      </div>
      
      <div className="space-y-0.5">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="text-lg font-black text-neutral-900 tracking-tight">
            {value}
          </span>
          <Badge variant="secondary" className="text-[8px] uppercase font-mono font-bold py-0 px-1 tracking-wider text-neutral-500 bg-neutral-100 border-none rounded">
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
