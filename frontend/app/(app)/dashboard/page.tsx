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
    <div className="space-y-6 max-w-5xl mx-auto text-left animate-in fade-in duration-200">
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">Progress Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your real-time application metrics, skill acquisition logs, and active streaks.
        </p>
      </div>

      {/* --- STAT CARDS GRID: WEEKLY STATS METRICS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <StatCard 
          title="Applications Sent" 
          value={WEEKLY_STATS_MOCK.applicationsSent.toString()} 
          badge="this week" 
          icon={<Send className="h-4 w-4 text-neutral-500" />}
          description="Target benchmark: 10 sent"
        />
        
        <StatCard 
          title="Skills Added" 
          value={`+${WEEKLY_STATS_MOCK.skillsAdded}`} 
          badge="verified" 
          icon={<Cpu className="h-4 w-4 text-emerald-600" />}
          description="Extracted from your CV delta"
        />
        
        <StatCard 
          title="Roadmap Progress" 
          value={`${WEEKLY_STATS_MOCK.roadmapCompletePercentage}%`} 
          badge="complete" 
          icon={<Milestone className="h-4 w-4 text-blue-600" />}
          description="Pillar 3 target: 100%"
        />
        
        <StatCard 
          title="Streak Counter" 
          value={`${WEEKLY_STATS_MOCK.streakDays} Days`} 
          badge="active" 
          icon={<Flame className="h-4 w-4 text-red-500 fill-red-500/10 animate-pulse" />}
          description="Keep applying to stay warm"
        />

      </div>

      {/* --- WORKSPACE SUB-SECTIONS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Application Status Metric Block */}
        <Card className="rounded-xl border bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-neutral-500" />
              <CardTitle className="text-sm font-bold text-neutral-900">Applications by Status</CardTitle>
            </div>
            <CardDescription className="text-xs">Visual tracking layout graph data pipeline nodes.</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center border border-dashed border-zinc-100 rounded-xl m-4 mt-0 bg-neutral-50/50">
            <span className="text-xs font-semibold text-muted-foreground tracking-tight">
              Chart pipeline interface rendering in Pillar 4
            </span>
          </CardContent>
        </Card>

        {/* AI Agent Assistant Nudges Feed */}
        <Card className="rounded-xl border bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-500" />
              <CardTitle className="text-sm font-bold text-neutral-900">AI Co-Pilot Nudges</CardTitle>
            </div>
            <CardDescription className="text-xs">Real-time prompt warnings evaluated against application pace.</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex flex-col items-center justify-center text-center border border-dashed border-zinc-100 rounded-xl m-4 mt-0 bg-neutral-50/50 p-4">
            <p className="text-xs font-bold text-neutral-700">No agent warning flags triggered yet</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Build your baseline index map profile inside CV Builder to open semantic monitoring.
            </p>
          </CardContent>
        </Card>

      </div>
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
  return (
    <Card className="bg-white border rounded-xl shadow-sm transition-all hover:border-zinc-300">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-bold tracking-tight text-neutral-500 uppercase">
          {title}
        </CardTitle>
        <div className="p-1.5 bg-neutral-50 border rounded-lg shrink-0">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-black text-neutral-900 tracking-tight">
            {value}
          </span>
          <Badge variant="secondary" className="text-[10px] uppercase font-mono font-bold py-0 px-1.5 tracking-wider text-neutral-600 bg-neutral-100 border-none">
            {badge}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium truncate">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}