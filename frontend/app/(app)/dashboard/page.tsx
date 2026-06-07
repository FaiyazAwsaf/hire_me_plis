"use client";

import React, { useEffect } from "react";
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
import api from "@/lib/api";
import { useDashboardStore } from "@/store/dashboard";

export default function DashboardPage() {
  const { stats, nudges, setStats, setNudges, markNudgeRead } = useDashboardStore();

  useEffect(() => {
    api
      .get<typeof stats>("/dashboard/stats")
      .then((r) => setStats(r.data!))
      .catch(console.error);

    api
      .get<{ nudges: typeof nudges; unread_count: number }>("/nudges")
      .then((r) => setNudges(r.data.nudges, r.data.unread_count))
      .catch(console.error);
  }, []);

  async function handleMarkRead(nudgeId: string) {
    markNudgeRead(nudgeId);
    await api.patch(`/nudges/${nudgeId}/read`).catch(console.error);
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10">

      {/* GRID CANVAS */}
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

        {/* BRUTALIST MAIN WORKSPACE */}
        <div className="space-y-8 rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] sm:p-8">

          {/* HEADER */}
          <div className="flex flex-col gap-1 pb-6 border-b-2 border-black">
            <h1 className="font-serif text-3xl md:text-4xl font-black tracking-tight text-neutral-900">
              Progress Dashboard
            </h1>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
              Overview of your active job application workflows, daily milestones, and automated insights.
            </p>
          </div>

          {/* MAIN LAYOUT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* --- TOP LEFT: METRICS GRID --- */}
            <div className="grid h-[280px] grid-cols-2 gap-4 rounded-none border-2 border-black bg-neutral-50 p-4 shadow-sm">
              <MiniStatCard
                title="Applications"
                value={stats?.applications.total ?? "—"}
                badge="total"
                icon={<Send className="h-3.5 w-3.5 text-black" />}
                description="Total sent"
                bgClass="bg-[#E3F2FD]"
              />

              <MiniStatCard
                title="Interviewing"
                value={stats?.applications.by_status.interviewing ?? "—"}
                badge="active"
                icon={<Cpu className="h-3.5 w-3.5 text-black" />}
                description="Moving forward"
                bgClass="bg-[#FFF9C4]"
              />

              <MiniStatCard
                title="Goals"
                value={stats ? `${stats.goals.completion_pct}%` : "—"}
                badge={stats ? `${stats.goals.completed}/${stats.goals.total}` : "—"}
                icon={<Milestone className="h-3.5 w-3.5 text-black" />}
                description="Progress"
                bgClass="bg-[#E1BEE7]"
              />

              <MiniStatCard
                title="Streak"
                value={stats?.streak_days ?? "—"}
                badge="days"
                icon={<Flame className="h-3.5 w-3.5 text-black" />}
                description="Active days"
                bgClass="bg-[#C8E6C9]"
              />
            </div>

            {/* --- TOP RIGHT: AI NUDGE FEED --- */}
            <Card className="flex h-[280px] flex-col justify-between overflow-hidden rounded-none border-2 border-black bg-white shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5 space-y-1 border-b-2 border-black bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="flex items-center gap-2">
                  <div className="rounded-none border border-black bg-orange-100 p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="h-4 w-4 text-orange-700" />
                  </div>
                  <CardTitle className="font-serif text-md font-black text-neutral-900 tracking-tight">AI Nudge System</CardTitle>
                </div>
                <CardDescription className="font-sans text-xs text-neutral-600">
                  Automated notifications for your goals.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex-1 overflow-y-auto space-y-2">
                {nudges.length === 0 ? (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-none border border-black bg-neutral-50 p-4 text-center">
                    <p className="font-serif text-sm font-black text-neutral-800">No active nudges</p>
                    <p className="font-sans text-[11px] text-neutral-600 max-w-xs mt-1 leading-relaxed">
                      Keep pushing — your AI co-pilot is watching for opportunities.
                    </p>
                  </div>
                ) : (
                  nudges.map((nudge) => (
                    <div key={nudge.id} className="rounded-none border border-orange-200 bg-orange-50 p-2.5 flex gap-2 items-start group hover:bg-orange-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed text-neutral-800 font-medium">{nudge.body}</p>
                      </div>
                      <button
                        onClick={() => handleMarkRead(nudge.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-orange-600 transition-all text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* --- BOTTOM LEFT: KANBAN BOARD PREVIEW --- */}
            <Link
              href="/tracker?view=kanban"
              className="group block h-[340px] transform transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <Card className="flex h-full flex-col justify-between overflow-hidden rounded-none border-2 border-black bg-white shadow-sm transition-all duration-150 group-hover:bg-blue-50 group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0 border-b-2 border-black bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="rounded-none border border-black bg-[#E3F2FD] p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      <KanbanSquare className="h-4 w-4 text-blue-700 shrink-0" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-md font-black text-neutral-900 tracking-tight">Kanban Board</CardTitle>
                      <CardDescription className="font-mono text-[10px] text-neutral-600 uppercase tracking-wider">Pipeline mapping</CardDescription>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </CardHeader>
                <CardContent className="px-5 pb-5 flex-1 flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-2 w-full rounded-none border-2 border-black bg-neutral-50 p-4 text-center shadow-sm">
                    <div className="space-y-0.5 border-r-2 border-black last:border-none bg-[#E3F2FD] py-2 rounded-none">
                      <div className="text-xl font-mono font-black text-blue-900">{stats?.applications.by_status.applied ?? 0}</div>
                      <div className="text-[9px] uppercase tracking-wider text-blue-700 font-bold">Applied</div>
                    </div>
                    <div className="space-y-0.5 border-r-2 border-black last:border-none bg-[#FFF9C4] py-2 rounded-none">
                      <div className="text-xl font-mono font-black text-amber-900">{stats?.applications.by_status.interviewing ?? 0}</div>
                      <div className="text-[9px] uppercase tracking-wider text-amber-700 font-bold">Interview</div>
                    </div>
                    <div className="space-y-0.5 border-r-2 border-black last:border-none bg-[#C8E6C9] py-2 rounded-none">
                      <div className="text-xl font-mono font-black text-green-900">{stats?.applications.by_status.offer ?? 0}</div>
                      <div className="text-[9px] uppercase tracking-wider text-green-700 font-bold">Offer</div>
                    </div>
                    <div className="space-y-0.5 last:border-none bg-[#FFCDD2] py-2 rounded-none">
                      <div className="text-xl font-mono font-black text-red-900">{stats?.applications.by_status.rejected ?? 0}</div>
                      <div className="text-[9px] uppercase tracking-wider text-red-700 font-bold">Rejected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* --- BOTTOM RIGHT: CALENDAR PREVIEW --- */}
            <Link
              href="/tracker?view=calendar"
              className="group block h-[340px] transform transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <Card className="flex h-full flex-col overflow-hidden rounded-none border-2 border-black bg-white shadow-sm transition-all duration-150 group-hover:bg-pink-50 group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0 border-b-2 border-black bg-gradient-to-r from-pink-50 to-pink-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="rounded-none border border-black bg-[#F8BBD0] p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      <CalendarDays className="h-4 w-4 text-pink-700 shrink-0" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-serif text-md font-black text-neutral-900 tracking-tight">Calendar</CardTitle>
                        <span className="rounded-none border-2 border-black bg-neutral-900 px-1.5 py-0.5 font-mono text-[9px] font-black text-white uppercase tracking-wider shadow-sm">Today</span>
                      </div>
                      <CardDescription className="font-sans text-xs text-neutral-600">Upcoming deadlines</CardDescription>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </CardHeader>

                <CardContent className="px-5 pb-5 overflow-y-auto flex-1 pr-2 space-y-2">
                  <div className="text-xs text-neutral-600 font-mono uppercase tracking-wider">
                    Check /tracker for full calendar
                  </div>
                  <div className="rounded-none border border-pink-200 bg-pink-50 p-2 text-xs">
                    <p className="font-semibold text-pink-900">View calendar</p>
                    <p className="text-[10px] text-pink-700">Manage all events and deadlines</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}

interface MiniStatCardProps {
  title: string;
  value: string | number;
  badge: string;
  icon: React.ReactNode;
  description: string;
  bgClass?: string;
}

function MiniStatCard({ title, value, badge, icon, description, bgClass = "bg-white" }: MiniStatCardProps) {
  return (
    <Card className={cn("flex flex-col justify-between space-y-2 rounded-none border-2 border-black p-3 shadow-sm transition-colors duration-150", bgClass)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] font-black tracking-wider text-neutral-700 uppercase truncate">
          {title}
        </span>
        <div className="shrink-0 rounded-none border border-black bg-white p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          {icon}
        </div>
      </div>

      <div className="space-y-0.5">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="font-mono text-lg font-black text-neutral-900 tracking-tight">
            {value}
          </span>
          <Badge variant="secondary" className="rounded-none border-2 border-black bg-white px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
            {badge}
          </Badge>
        </div>
        <p className="font-sans text-[10px] text-neutral-600 font-medium truncate">
          {description}
        </p>
      </div>
    </Card>
  );
}
