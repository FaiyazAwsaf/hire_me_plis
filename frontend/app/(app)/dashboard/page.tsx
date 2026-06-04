"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Cpu, 
  Milestone, 
  Flame, 
  Sparkles, 
  PieChart 
} from "lucide-react";

// Mock weekly stats tracking matching data expectations
const WEEKLY_STATS_MOCK = {
  applicationsSent: 6,
  skillsAdded: 4,
  roadmapCompletePercentage: 72,
  streakDays: 5,
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
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-neutral-950">Progress Dashboard</h1>
        <p className="max-w-2xl text-sm leading-6 text-neutral-600">
          Track your real-time application metrics, skill acquisition logs, and active streaks.
        </p>
      </div>

      {/* --- STAT CARDS GRID: WEEKLY STATS METRICS --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        <StatCard 
          title="Applications Sent" 
          value={WEEKLY_STATS_MOCK.applicationsSent.toString()} 
          badge="This Week" 
          icon={<Send className="h-4 w-4 text-neutral-500" />}
          description="Target benchmark: 10 sent"
        />
        
        <StatCard 
          title="Skills Added" 
          value={`+${WEEKLY_STATS_MOCK.skillsAdded}`} 
          badge="Verified" 
          icon={<Cpu className="h-4 w-4 text-emerald-600" />}
          description="Extracted from your CV delta"
        />
        
        <StatCard 
          title="Roadmap Progress" 
          value={`${WEEKLY_STATS_MOCK.roadmapCompletePercentage}%`} 
          badge="Complete" 
          icon={<Milestone className="h-4 w-4 text-blue-600" />}
          description="Pillar 3 target: 100%"
        />
        
        <StatCard 
          title="Streak Counter" 
          value={`${WEEKLY_STATS_MOCK.streakDays} Days`} 
          badge="Active" 
          icon={<Flame className="h-4 w-4 text-red-500 fill-red-500/10 animate-pulse" />}
          description="Keep applying to stay warm"
        />

      </div>

      {/* --- WORKSPACE SUB-SECTIONS --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Application Status Metric Block */}
        <Card className="overflow-hidden rounded-2xl border border-white/65 bg-white/55 shadow-[0_18px_55px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/65 shadow-sm">
                <PieChart className="h-4 w-4 text-slate-600" />
              </div>
              <CardTitle className="text-sm font-bold text-neutral-950">Applications by Status</CardTitle>
            </div>
            <CardDescription className="text-xs text-neutral-500">Visual tracking layout graph data pipeline nodes.</CardDescription>
          </CardHeader>
          <CardContent className="m-4 mt-0 flex h-40 items-center justify-center rounded-2xl border border-white/70 bg-slate-100/45 shadow-inner">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/65 shadow-sm">
                <PieChart className="h-5 w-5 text-slate-400" />
              </div>
              <span className="text-xs font-semibold tracking-tight text-neutral-500">
                Chart pipeline interface rendering in Pillar 4
              </span>
            </div>
          </CardContent>
        </Card>

        {/* AI Agent Assistant Nudges Feed */}
        <Card className="overflow-hidden rounded-2xl border border-white/65 bg-white/55 shadow-[0_18px_55px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-red-50/70 shadow-sm">
                <Sparkles className="h-4 w-4 text-red-500" />
              </div>
              <CardTitle className="text-sm font-bold text-neutral-950">AI Co-Pilot Nudges</CardTitle>
            </div>
            <CardDescription className="text-xs text-neutral-500">Real-time prompt warnings evaluated against application pace.</CardDescription>
          </CardHeader>
          <CardContent className="m-4 mt-0 flex h-40 flex-col items-center justify-center rounded-2xl border border-white/70 bg-red-50/25 p-4 text-center shadow-inner">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/65 shadow-sm">
              <Sparkles className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-xs font-bold text-neutral-800">No agent warning flags triggered yet</p>
            <p className="mt-1 max-w-xs text-[11px] leading-5 text-neutral-500">
              Build your baseline index map profile inside CV Builder to open semantic monitoring.
            </p>
          </CardContent>
        </Card>

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

{/* --- REUSABLE STRUCTURED STATCARD INTERFACE --- */}
interface StatCardProps {
  title: string;
  value: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
}

function StatCard({ title, value, badge, icon, description }: StatCardProps) {
  const badgeClass = {
    "This Week": "border-slate-200/80 bg-slate-100/65 text-slate-700",
    Verified: "border-emerald-200/80 bg-emerald-50/75 text-emerald-700",
    Complete: "border-blue-200/80 bg-blue-50/75 text-blue-700",
    Active: "border-orange-200/80 bg-orange-50/75 text-orange-700",
  }[badge] ?? "border-slate-200/80 bg-slate-100/65 text-slate-700";

  return (
    <Card className="group rounded-2xl border border-white/65 bg-white/55 shadow-[0_16px_45px_rgba(15,23,42,0.09)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_22px_60px_rgba(15,23,42,0.13)]">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-[11px] font-bold tracking-[0.08em] text-neutral-500 uppercase">
          {title}
        </CardTitle>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/65 shadow-sm transition-all group-hover:bg-white/90 group-hover:shadow-md">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-black text-neutral-900 tracking-tight">
            {value}
          </span>
          <Badge variant="secondary" className={`border px-2 py-0 text-[10px] font-bold uppercase tracking-[0.08em] shadow-sm backdrop-blur ${badgeClass}`}>
            {badge}
          </Badge>
        </div>
        <p className="truncate text-[11px] font-medium text-neutral-500">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
