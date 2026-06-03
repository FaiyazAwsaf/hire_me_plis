"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  KanbanSquare, 
  CalendarDays, 
  Target, 
  CheckCircle2, 
  Circle,
  Briefcase,
  Milestone
} from "lucide-react";

// Kanban Data Layout Parameters
const COLUMNS = [
  { id: "applied",      label: "Applied",       color: "bg-blue-500" },
  { id: "interviewing", label: "Interviewing",  color: "bg-yellow-500" },
  { id: "offer",        label: "Offer",         color: "bg-green-500" },
  { id: "rejected",     label: "Rejected",      color: "bg-red-500" },
] as const;

// Mock Goal Objects linked to Career Paths
interface Goal {
  id: string;
  text: string;
  targetDate: string;
  category: "applications" | "learning" | "cv";
  status: "todo" | "completed";
}

const INITIAL_GOALS: Goal[] = [
  { id: "g-1", text: "Apply to 5 jobs this week", targetDate: "June 07, 2026", category: "applications", status: "todo" },
  { id: "g-2", text: "Finish DSA course by Friday", targetDate: "June 05, 2026", category: "learning", status: "todo" },
  { id: "g-3", text: "Update CV by Sunday", targetDate: "June 07, 2026", category: "cv", status: "completed" }
];

export default function TrackerPage() {
  // Navigation active tab controller layout state
  const [activeTab, setActiveTab] = useState<"kanban" | "calendar" | "goals">("kanban");
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, status: g.status === "todo" ? "completed" : "todo" } : g));
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto animate-in fade-in duration-200">
      
      {/* --- WORKSPACE PAGE HERO HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Career Delivery Hub</h1>
          <p className="text-sm text-muted-foreground">Manage ongoing board applications, milestone target settings, and task deadlines.</p>
        </div>
        
        {activeTab === "kanban" && (
          <Button size="sm" className="bg-black hover:bg-neutral-800 text-white rounded-xl h-9 px-4 font-semibold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add application</span>
          </Button>
        )}
        {activeTab === "goals" && (
          <Button size="sm" className="bg-black hover:bg-neutral-800 text-white rounded-xl h-9 px-4 font-semibold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add Goal Parameter</span>
          </Button>
        )}
      </div>

      {/* --- HOVER TABS INTERNAL SUB-NAVBAR --- */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab("kanban")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all",
            activeTab === "kanban" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <KanbanSquare className="h-3.5 w-3.5" />
          <span>Applications Board</span>
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all",
            activeTab === "calendar" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Calendar Grid</span>
        </button>
        <button
          onClick={() => setActiveTab("goals")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all",
            activeTab === "goals" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <Target className="h-3.5 w-3.5" />
          <span>Goal Settings</span>
          <Badge className="ml-0.5 h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-red-500 text-white font-black border-none">
            {goals.filter(g => g.status === "todo").length}
          </Badge>
        </button>
      </div>

      {/* --- TAB CONDITIONAL ROUTING STREAM RENDERS --- */}
      <div className="pt-2">
        
        {/* VIEW 1: KANBAN BOARD */}
        {activeTab === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4 animate-in fade-in duration-200">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex flex-col gap-3 min-w-[270px] bg-neutral-50/40 border p-3 rounded-2xl flex-1">
                <div className="flex items-center gap-2 px-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <span className="font-bold text-xs text-neutral-800 uppercase tracking-wide">{col.label}</span>
                  <Badge variant="secondary" className="ml-auto font-mono text-xs font-bold bg-neutral-100 text-neutral-600 border-none px-2 py-0">
                    {col.id === "applied" ? "1" : "0"}
                  </Badge>
                </div>

                {/* Drop zone */}
                <div className="flex-1 min-h-[350px] rounded-xl border border-dashed border-zinc-200 bg-white/50 p-2 space-y-2">
                  {col.id === "applied" && (
                    <Card className="bg-white border rounded-xl shadow-sm opacity-90">
                      <CardHeader className="pb-1 pt-3.5 px-3.5">
                        <CardTitle className="text-xs font-bold text-neutral-900">Software Engineer</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3.5 pb-3.5 text-[11px] text-muted-foreground font-medium">
                        Acme Corp · applied today
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: CALENDAR VIEW */}
        {activeTab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
            <Card className="lg:col-span-3 rounded-2xl border bg-white p-5">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <span className="text-sm font-black text-neutral-900">June 2026</span>
                <span className="text-[11px] uppercase font-mono font-bold bg-neutral-50 text-neutral-500 border rounded-lg px-2 py-0.5">
                  Pipeline Lock Sequence
                </span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase text-neutral-400 mb-2 tracking-wider">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {/* Basic calendar box cells generator */}
                {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                  <div 
                    key={day} 
                    className={cn(
                      "p-2.5 min-h-14 border rounded-xl text-xs font-bold flex flex-col justify-between transition-colors",
                      day === 5 ? 'border-blue-200 bg-blue-50/50 text-blue-700' : 
                      day === 7 ? 'border-red-200 bg-red-50/50 text-red-600' : 
                      'border-neutral-100 bg-neutral-50/10 text-neutral-700'
                    )}
                  >
                    <span>{day}</span>
                    {day === 5 && <span className="h-1.5 w-1.5 bg-blue-600 rounded-full block animate-pulse" title="DSA Finish Target" />}
                    {day === 7 && <span className="h-1.5 w-1.5 bg-red-500 rounded-full block animate-pulse" title="CV Upgrade Deadline" />}
                  </div>
                ))}
              </div>
            </Card>

            {/* Calendar Agenda Task List Card */}
            <div className="space-y-4">
              <Card className="rounded-2xl border bg-white p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <CalendarDays className="h-4 w-4 text-neutral-400" />
                  <span>Agenda Milestones</span>
                </h3>
                <div className="space-y-2">
                  <div className="p-3 border border-blue-100 bg-blue-50/20 rounded-xl">
                    <span className="text-[9px] font-bold font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase">Due June 5</span>
                    <h4 className="text-xs font-bold text-neutral-900 mt-1.5">Finish DSA course by Friday</h4>
                  </div>
                  <div className="p-3 border border-red-100 bg-red-50/20 rounded-xl">
                    <span className="text-[9px] font-bold font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md uppercase">Due June 7</span>
                    <h4 className="text-xs font-bold text-neutral-900 mt-1.5">Update CV by Sunday</h4>
                    <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Apply to remaining benchmark openings.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW 3: GOALS SETTING CHECKLIST */}
        {activeTab === "goals" && (
          <div className="max-w-3xl space-y-4 animate-in fade-in duration-200">
            <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b bg-neutral-50/40">
                <CardTitle className="text-sm font-bold text-neutral-900">Sprint Directives Checklist</CardTitle>
                <CardDescription className="text-xs">Goals evaluated directly against active platform trackers.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {goals.map((goal) => (
                  <div 
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className="flex items-center justify-between p-4 hover:bg-neutral-50/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {goal.status === "completed" ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-neutral-300 group-hover:text-neutral-400 shrink-0" />
                      )}
                      <span className={cn(
                        "text-xs font-medium truncate transition-colors",
                        goal.status === "completed" ? "line-through text-neutral-400 font-normal" : "text-neutral-800 font-bold"
                      )}>
                        {goal.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-4">
                      <Badge className={cn(
                        "text-[9px] uppercase font-mono font-black py-0.5 px-2 tracking-wide border-none",
                        goal.category === "applications" ? "bg-orange-50 text-orange-700" :
                        goal.category === "learning" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                      )}>
                        {goal.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono font-semibold hidden sm:inline">
                        Due {goal.targetDate}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}