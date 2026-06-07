"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Plus,
  KanbanSquare,
  CalendarDays,
  Target,
  CheckCircle2,
  Circle,
  Bell,
  Trash2,
  Clock,
  Sparkles,
  GripVertical
} from "lucide-react";
import api from "@/lib/api";
import { useTrackerStore, type Application, type ApplicationStatus, type Goal, type CalendarEvent } from "@/store/tracker";

type Tab = "kanban" | "calendar" | "goals";

const COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: "applied", label: "Applied", color: "bg-blue-500" },
  { id: "interviewing", label: "Interviewing", color: "bg-amber-500" },
  { id: "offer", label: "Offer", color: "bg-emerald-500" },
  { id: "rejected", label: "Rejected", color: "bg-rose-500" },
];

function TrackerContent() {
  const searchParams = useSearchParams();
  const urlView = searchParams.get("view") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(urlView || "kanban");

  const { applications, goals, events, setApplications, setGoals, setEvents, addApplication, addGoal, updateGoal, removeGoal, addEvent, removeEvent, updateApplicationStatus } = useTrackerStore();

  const [showAppForm, setShowAppForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  // Form state
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    Promise.all([
      api.get<{ applications: Application[] }>("/applications").then(r => setApplications(r.data.applications)).catch(console.error),
      api.get<{ goals: Goal[] }>("/goals").then(r => setGoals(r.data.goals)).catch(console.error),
    ]).finally(() => setLoading(false));
  }, []);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault();
    const appId = draggedAppId;
    if (!appId) return;

    updateApplicationStatus(appId, newStatus);
    try {
      await api.patch(`/applications/${appId}/status`, { status: newStatus });
    } catch {
      const app = applications.find(a => a.id === appId);
      if (app) updateApplicationStatus(appId, app.status);
    }
    setDraggedAppId(null);
  };

  // Form handlers
  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole || !newCompany) return;
    setSaving(true);
    try {
      const res = await api.post<Application>("/applications", { role: newRole, company: newCompany, status: "applied", url: null, deadline: null, salary_range: null, notes: null });
      addApplication(res.data);
      setNewRole("");
      setNewCompany("");
      setShowAppForm(false);
    } catch (err) {
      console.error("Failed to add application", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalDate) return;
    setSaving(true);
    try {
      const res = await api.post<Goal>("/goals", { title: newGoalTitle, target_date: newGoalDate });
      addGoal(res.data);
      setNewGoalTitle("");
      setNewGoalDate("");
      setShowGoalForm(false);
    } catch (err) {
      console.error("Failed to add goal", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = async (goal: Goal) => {
    updateGoal(goal.id, { completed_at: goal.completed_at ? null : new Date().toISOString() });
    try {
      await api.patch(`/goals/${goal.id}`, { completed: !goal.completed_at });
    } catch {
      updateGoal(goal.id, { completed_at: goal.completed_at });
    }
  };

  const deleteGoal = async (id: string) => {
    removeGoal(id);
    await api.delete(`/goals/${id}`).catch(console.error);
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-mono font-black uppercase text-neutral-500">Loading…</div>;
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10 select-none text-left">

      {/* GRID CANVAS */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" style={{ backgroundImage: `linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="relative z-10 mx-auto w-full max-w-6xl flex flex-col rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden p-6 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 border-b-2 border-black pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-black shrink-0" />
              <h1 className="text-xl font-mono font-black uppercase tracking-wider text-black">Career Delivery Hub</h1>
            </div>
            <p className="text-xs font-sans text-neutral-600 mt-0.5">Manage ongoing applications, goals, and track your career progress.</p>
          </div>

          {activeTab === "kanban" && (
            <Button onClick={() => setShowAppForm(!showAppForm)} size="sm" className="flex h-10 items-center gap-2 rounded-none border-2 border-primary bg-primary px-4 text-xs font-mono font-black uppercase text-primary-foreground shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-primary/90">
              <Plus className="h-4 w-4 stroke-[3px]" />
              {showAppForm ? "Close Form" : "Add application"}
            </Button>
          )}

          {(activeTab === "calendar" || activeTab === "goals") && (
            <Button onClick={() => setShowGoalForm(!showGoalForm)} size="sm" className="flex h-10 items-center gap-2 rounded-none border-2 border-primary bg-primary px-4 text-xs font-mono font-black uppercase text-primary-foreground shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-primary/90">
              <Plus className="h-4 w-4 stroke-[3px]" />
              {showGoalForm ? "Close" : "Add Goal"}
            </Button>
          )}
        </div>

        {/* FORMS */}
        {showAppForm && (
          <div className="rounded-none border-2 border-black bg-neutral-50 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <form onSubmit={handleAddApplication} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-mono font-black uppercase tracking-wider">Role</Label>
                <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Frontend Developer" className="rounded-none border-2 border-black bg-white px-3 py-2 text-xs" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-mono font-black uppercase tracking-wider">Company</Label>
                <Input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="e.g. Stripe" className="rounded-none border-2 border-black bg-white px-3 py-2 text-xs" required />
              </div>
              <Button type="submit" disabled={saving} size="sm" className="h-10 rounded-none border-2 border-primary bg-primary text-xs font-mono font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {saving ? "…" : "Add"}
              </Button>
            </form>
          </div>
        )}

        {showGoalForm && (
          <div className="rounded-none border-2 border-black bg-neutral-50 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-mono font-black uppercase tracking-wider">Goal</Label>
                <Input value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="e.g. Complete React course" className="rounded-none border-2 border-black bg-white px-3 py-2 text-xs" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-mono font-black uppercase tracking-wider">Target Date</Label>
                <Input type="date" value={newGoalDate} onChange={(e) => setNewGoalDate(e.target.value)} className="rounded-none border-2 border-black bg-white px-3 py-2 text-xs" required />
              </div>
              <Button type="submit" disabled={saving} size="sm" className="h-10 rounded-none border-2 border-primary bg-primary text-xs font-mono font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {saving ? "…" : "Add"}
              </Button>
            </form>
          </div>
        )}

        {/* TAB SELECTOR */}
        <div className="flex max-w-md gap-1.5 rounded-none border-2 border-black bg-neutral-100 p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <button onClick={() => setActiveTab("kanban")} className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-black uppercase rounded-none border-2 transition-all", activeTab === "kanban" ? "bg-primary text-primary-foreground border-primary shadow-[1px_1px_0px_rgba(0,0,0,0.2)]" : "bg-transparent text-neutral-600 border-transparent hover:text-black")}>
            <KanbanSquare className="h-3.5 w-3.5" />
            Applications
          </button>
          <button onClick={() => setActiveTab("goals")} className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-black uppercase rounded-none border-2 transition-all", activeTab === "goals" ? "bg-primary text-primary-foreground border-primary shadow-[1px_1px_0px_rgba(0,0,0,0.2)]" : "bg-transparent text-neutral-600 border-transparent hover:text-black")}>
            <Target className="h-3.5 w-3.5" />
            Goals
          </button>
        </div>

        {/* KANBAN TAB */}
        {activeTab === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
              const columnApps = applications.filter(app => app.status === col.id);
              return (
                <div key={col.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)} className="flex min-w-[280px] flex-1 flex-col gap-3 rounded-none border-2 border-black bg-neutral-50 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 px-1">
                    <span className={`h-2.5 w-2.5 rounded-none border-2 border-black ${col.color}`} />
                    <span className="font-mono font-black text-xs text-black uppercase">{col.label}</span>
                    <Badge className="ml-auto font-mono text-xs font-black bg-white border-2 border-black text-black px-2 py-0 rounded-none">{columnApps.length}</Badge>
                  </div>

                  <div className="min-h-[400px] flex-1 space-y-3 rounded-none border-2 border-black bg-white p-2">
                    {columnApps.map((app) => (
                      <div key={app.id} draggable onDragStart={(e) => handleDragStart(e, app.id)} className="space-y-2 rounded-none border-2 border-black bg-white p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 cursor-grab active:cursor-grabbing group transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-sans font-black text-black">{app.role}</h4>
                            <p className="text-[11px] font-sans font-bold text-neutral-600 mt-0.5">{app.company}</p>
                          </div>
                          <GripVertical className="h-3.5 w-3.5 text-neutral-300 group-hover:text-black shrink-0" />
                        </div>
                        {app.deadline && <p className="text-[10px] text-neutral-500 font-mono">Due: {app.deadline}</p>}
                      </div>
                    ))}

                    {columnApps.length === 0 && (
                      <div className="h-full min-h-[120px] flex items-center justify-center text-center text-[10px] font-mono font-black uppercase text-neutral-300">
                        Drop space empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === "goals" && (
          <div className="max-w-2xl mx-auto w-full">
            <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="border-b-2 border-black bg-neutral-50 p-4">
                <h3 className="text-xs font-mono font-black uppercase">Sprint Directives</h3>
              </div>
              <div className="divide-y-2 divide-black">
                {goals.map((goal) => {
                  const completed = !!goal.completed_at;
                  return (
                    <div key={goal.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 group">
                      <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleGoal(goal)}>
                        <div className="shrink-0">
                          {completed ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 stroke-[2.5px]" />
                          ) : (
                            <Circle className="h-4.5 w-4.5 text-neutral-300 stroke-[2.5px]" />
                          )}
                        </div>
                        <span className={cn("text-xs font-sans font-black", completed && "line-through text-neutral-400")}>
                          {goal.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-[10px] text-neutral-500 font-mono font-bold">
                          {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                        <Button onClick={() => deleteGoal(goal.id)} size="icon" variant="ghost" className="h-7 w-7 text-neutral-300 hover:text-rose-600 rounded-none opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-3.5 w-3.5 stroke-[2.5px]" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs font-mono font-black uppercase text-neutral-500">Loading…</div>}>
      <TrackerContent />
    </Suspense>
  );
}
