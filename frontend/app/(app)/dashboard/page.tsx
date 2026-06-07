"use client";

import React, { useEffect, useState } from "react";
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
import type { CalendarEvent } from "@/store/tracker";

// June 2026: day 1 falls on Sunday (start-of-week = 0 blanks)
const JUNE_START_DOW = 0;
const JUNE_DAYS = 30;
const WEEK_HEADERS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export default function DashboardPage() {
  const { stats, nudges, setStats, setNudges, markNudgeRead } = useDashboardStore();
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);

  const today = new Date();
  const isJune2026 = today.getFullYear() === 2026 && today.getMonth() === 5;
  const todayDay = isJune2026 ? today.getDate() : null;

  // Leading blank cells + date cells for the June 2026 grid
  const cells: (number | null)[] = [
    ...Array<null>(JUNE_START_DOW).fill(null),
    ...Array.from({ length: JUNE_DAYS }, (_, i) => i + 1),
  ];

  useEffect(() => {
    api.get<typeof stats>("/dashboard/stats").then((r) => setStats(r.data!)).catch(console.error);
    api.get<{ nudges: typeof nudges; unread_count: number }>("/nudges")
      .then((r) => setNudges(r.data.nudges, r.data.unread_count))
      .catch(console.error);
    api.get<{ events: CalendarEvent[] }>("/calendar/events?start=2026-06-01&end=2026-06-30")
      .then((r) => setCalEvents(r.data.events))
      .catch(console.error);
  }, []);

  async function handleMarkRead(nudgeId: string) {
    markNudgeRead(nudgeId);
    await api.patch(`/nudges/${nudgeId}/read`).catch(console.error);
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-linear-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10">

      {/* GRID CANVAS */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(to right,#1A1A1A 1px,transparent 1px),linear-gradient(to bottom,#1A1A1A 1px,transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl animate-in fade-in duration-200 text-left">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── TOP LEFT: 4 METRIC CARDS ── */}
            <div className="grid grid-cols-2 gap-3 rounded-none border-2 border-black bg-neutral-50 p-3 shadow-sm">
              <MiniStatCard
                title="Applications"
                value={stats?.applications.total ?? "—"}
                badge="This Week"
                icon={<Send className="h-3.5 w-3.5 text-black" />}
                description="Target: 10 sent"
                bgClass="bg-[#D6E8F5]"
              />
              <MiniStatCard
                title="Skills Added"
                value={stats ? `+${stats.goals.completed}` : "—"}
                badge="Verified"
                icon={<Cpu className="h-3.5 w-3.5 text-black" />}
                description="Parsed profile updates"
                bgClass="bg-[#D4EDDA]"
              />
              <MiniStatCard
                title="Roadmap"
                value={stats ? `${stats.goals.completion_pct}%` : "—"}
                badge="Progress"
                icon={<Milestone className="h-3.5 w-3.5 text-black" />}
                description="Milestone 3 target"
                bgClass="bg-[#E8D5F5]"
              />
              <MiniStatCard
                title="Streak"
                value={stats?.streak_days != null ? `${stats.streak_days} Days` : "—"}
                badge="Active"
                icon={<Flame className="h-3.5 w-3.5 text-black" />}
                description="Actions logged daily"
                bgClass="bg-[#FDEBD0]"
              />
            </div>

            {/* ── TOP RIGHT: AI NUDGE SYSTEM ── */}
            <Card className="flex flex-col overflow-hidden rounded-none border-2 border-black bg-white">
              <CardHeader className="pb-3 pt-5 px-5 space-y-1 border-b-2 border-black bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <div className="rounded-none border-2 border-black bg-[#FFF9C4] p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="h-4 w-4 text-amber-800" />
                  </div>
                  <CardTitle className="font-serif text-base font-black text-neutral-900 tracking-tight">
                    AI Nudge System
                  </CardTitle>
                </div>
                <CardDescription className="font-sans text-xs text-neutral-500">
                  Automated notifications evaluated against active workspace signals.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex-1 overflow-y-auto space-y-2 pt-4">
                {nudges.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-none border-2 border-black bg-[#FEFDE8] p-5 text-center">
                    <p className="font-serif text-sm font-black text-amber-900">No warning flags triggered</p>
                    <p className="font-sans text-[11px] text-amber-700 max-w-xs mt-1.5 leading-relaxed">
                      Expand your core index metrics to unlock predictive semantic tracking signals.
                    </p>
                  </div>
                ) : (
                  nudges.map((nudge) => (
                    <div key={nudge.id} className="rounded-none border-2 border-black bg-[#FFF9C4] p-2.5 flex gap-2 items-start group hover:bg-yellow-100 transition-colors">
                      <p className="flex-1 text-xs leading-relaxed text-neutral-800 font-medium min-w-0">{nudge.body}</p>
                      <button onClick={() => handleMarkRead(nudge.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-amber-600 transition-all text-xs">✕</button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* ── BOTTOM LEFT: KANBAN PREVIEW ── */}
            <Link href="/tracker?view=kanban" className="group block transform transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5">
              <Card className="flex flex-col overflow-hidden rounded-none border-2 border-black bg-white transition-all duration-150 group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <div className="rounded-none border-2 border-black bg-[#FFF9C4] p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      <KanbanSquare className="h-4 w-4 text-amber-800 shrink-0" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-base font-black text-neutral-900 tracking-tight">Kanban Board</CardTitle>
                      <CardDescription className="font-mono text-[10px] text-neutral-600 uppercase tracking-wider">Pipeline mapping active roles</CardDescription>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-black transition-transform" />
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-4 flex-1 flex items-center">
                  <div className="grid grid-cols-4 w-full rounded-none border-2 border-black overflow-hidden">
                    <KanbanCol count={stats?.applications.by_status.applied ?? 0} label="Applied" active />
                    <KanbanCol count={stats?.applications.by_status.interviewing ?? 0} label="Interview" />
                    <KanbanCol count={stats?.applications.by_status.offer ?? 0} label="Offer" />
                    <KanbanCol count={stats?.applications.by_status.rejected ?? 0} label="Rejected" last />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* ── BOTTOM RIGHT: CALENDAR PREVIEW ── */}
            <Link href="/tracker?view=calendar" className="group block transform transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5">
              <Card className="flex flex-col overflow-hidden rounded-none border-2 border-black bg-white transition-all duration-150 group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between space-y-0 border-b-2 border-black shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="rounded-none border-2 border-black bg-[#E8D5F5] p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      <CalendarDays className="h-4 w-4 text-purple-800 shrink-0" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-serif text-base font-black text-neutral-900 tracking-tight">Calendar & Agenda</CardTitle>
                        <span className="rounded-none border-2 border-black bg-neutral-900 px-1.5 py-0.5 font-mono text-[9px] font-black text-white uppercase tracking-wider">
                          June 2026
                        </span>
                      </div>
                      <CardDescription className="font-sans text-xs text-neutral-500">Scroll layout showing due parameters</CardDescription>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-black transition-transform" />
                </CardHeader>

                <CardContent className="px-3 pb-3 pt-2 flex-1 overflow-hidden">
                  {/* Day-of-week headers */}
                  <div className="grid grid-cols-7 mb-0.5">
                    {WEEK_HEADERS.map((d) => (
                      <div key={d} className="text-center text-[9px] font-mono font-black text-neutral-400 uppercase py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Date cells */}
                  <div className="grid grid-cols-7 gap-px bg-black border border-black">
                    {cells.map((day, i) => {
                      if (!day) {
                        return <div key={`blank-${i}`} className="bg-neutral-50 min-h-8.5" />;
                      }
                      const dayEvents = calEvents.filter(
                        (e) => new Date(e.start_dt).getDate() === day
                      );
                      const isToday = todayDay === day;
                      return (
                        <div
                          key={day}
                          className={cn(
                            "flex flex-col min-h-8.5 p-0.5 bg-white",
                            isToday && "bg-amber-50 ring-2 ring-amber-500 ring-inset z-10"
                          )}
                        >
                          <span className={cn(
                            "text-[9px] font-mono font-black leading-none px-0.5 pt-0.5",
                            isToday ? "text-amber-700" : "text-black"
                          )}>
                            {day}
                          </span>
                          {dayEvents.slice(0, 1).map((e) => (
                            <div key={e.id} className="mt-0.5 bg-[#E8D5F5] border border-purple-300 px-0.5 overflow-hidden">
                              <span className="text-[7px] font-bold text-purple-900 uppercase truncate block leading-tight">
                                {e.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
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

// ── Sub-components ──────────────────────────────────────────

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
    <Card className={cn("flex flex-col justify-between rounded-none border-2 border-black p-3 shadow-sm", bgClass)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[9px] font-black tracking-wider text-neutral-700 uppercase">{title}</span>
        <div className="shrink-0 rounded-none border-2 border-black bg-white p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <span className="font-mono text-2xl font-black text-neutral-900 tracking-tight leading-none">{value}</span>
        <Badge variant="secondary" className="rounded-none border-2 border-black bg-white px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_rgba(0,0,0,1)] shrink-0">
          {badge}
        </Badge>
      </div>
      <p className="font-sans text-[10px] text-neutral-600 font-medium mt-1 truncate">{description}</p>
    </Card>
  );
}

function KanbanCol({ count, label, active = false, last = false }: { count: number; label: string; active?: boolean; last?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center py-5",
      active ? "bg-[#D6E8F5]" : "bg-white",
      !last && "border-r-2 border-black"
    )}>
      <span className={cn(
        "text-2xl font-mono font-black",
        active ? "text-blue-900" : "text-neutral-300"
      )}>
        {count}
      </span>
      <span className={cn(
        "text-[9px] uppercase tracking-wider font-black mt-0.5",
        active ? "text-blue-700" : "text-neutral-300"
      )}>
        {label}
      </span>
    </div>
  );
}
