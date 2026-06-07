"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  Trash2,
  Sparkles,
  GripVertical,
  Bell,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { useTrackerStore, type Application, type ApplicationStatus, type Goal, type CalendarEvent } from "@/store/tracker";

const COLUMNS = [
  { id: "applied", label: "Applied", color: "bg-blue-500" },
  { id: "interviewing", label: "Interviewing", color: "bg-amber-500" },
  { id: "offer", label: "Offer", color: "bg-emerald-500" },
  { id: "rejected", label: "Rejected", color: "bg-rose-500" },
] as const;

function TrackerContent() {
  const searchParams = useSearchParams();
  const urlView = searchParams.get("view") as "kanban" | "calendar" | "goals" | null;
  const [activeTab, setActiveTab] = useState<"kanban" | "calendar" | "goals">(
    urlView === "kanban" || urlView === "calendar" || urlView === "goals" ? urlView : "kanban"
  );
  const formRef = useRef<HTMLDivElement>(null);

  const { applications, goals, events, setApplications, setGoals, setEvents, addApplication, addGoal, updateGoal, removeGoal, updateApplicationStatus } = useTrackerStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Real‑time current date (system clock)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();      // 0‑based
  const currentDayNumber = today.getDate();
  const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(currentDayNumber).padStart(2, "0")}`;

  // Calendar state: dynamic year and month (unbounded)
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [displayMonth, setDisplayMonth] = useState(currentMonth); // 0‑based

  // Recompute calendar grid when month/year changes
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay(); // Sunday = 0

  const goPrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayYear(prev => prev - 1);
      setDisplayMonth(11);
    } else {
      setDisplayMonth(prev => prev - 1);
    }
  };

  const goNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayYear(prev => prev + 1);
      setDisplayMonth(0);
    } else {
      setDisplayMonth(prev => prev + 1);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Application form states
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");

  // Goal form states
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDate, setNewGoalDate] = useState(todayStr);

  // Dynamic categories
  const [categories, setCategories] = useState<string[]>(["learning", "applications", "cv"]);
  const [newTaskCat, setNewTaskCat] = useState<string>("learning");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [showInlineCustomInput, setShowInlineCustomInput] = useState(false);

  const [showAppForm, setShowAppForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [selectedAgendaDay, setSelectedAgendaDay] = useState<number>(currentDayNumber);
  const [selectedDayInspector, setSelectedDayInspector] = useState<number | null>(null);

  // Load data – backend still only provides June–August 2026 data (no change)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [appsRes, goalsRes, eventsRes] = await Promise.all([
          api.get<{ applications: Application[] }>("/applications"),
          api.get<{ goals: Goal[] }>("/goals"),
          api.get<{ events: CalendarEvent[] }>("/calendar/events?start=2026-06-01&end=2026-08-31"),
        ]);
        setApplications(appsRes.data.applications);
        setGoals(goalsRes.data.goals);
        setEvents(eventsRes.data.events);
      } catch (err) {
        console.error("Failed to load tracker data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setApplications, setGoals, setEvents]);

  // Drag & drop (unchanged)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = async (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("text/plain") || draggedAppId;
    if (!appId) return;
    const app = applications.find(a => a.id === appId);
    const prevStatus = app?.status;
    updateApplicationStatus(appId, newStatus);
    try {
      await api.patch(`/applications/${appId}/status`, { status: newStatus });
    } catch (err) {
      if (prevStatus) updateApplicationStatus(appId, prevStatus);
      console.error("Failed to update status:", err);
    }
    setDraggedAppId(null);
  };

  // Add application
  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole || !newCompany) return;
    setSaving(true);
    try {
      const res = await api.post<Application>("/applications", {
        role: newRole,
        company: newCompany,
        status: "applied",
        url: null,
        deadline: null,
        salary_range: null,
        notes: null,
      });
      addApplication(res.data);
      setNewRole("");
      setNewCompany("");
      setShowAppForm(false);
    } catch (err) {
      console.error("Failed to add application:", err);
    } finally {
      setSaving(false);
    }
  };

  // Category dropdown
  const handleDropdownCategoryChange = (val: string) => {
    if (val === "ADD_NEW_OPTION_TRIGGER") {
      setShowInlineCustomInput(true);
      setNewTaskCat("");
    } else {
      setShowInlineCustomInput(false);
      setNewTaskCat(val);
    }
  };

  // Add goal – past‑date validation uses real current date
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalDate) return;

    const chosenDateObj = new Date(newGoalDate + "T00:00:00");
    const todayCompare = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (chosenDateObj < todayCompare) {
      alert("Operation Blocked: Cannot assign milestones or directives to a past date.");
      return;
    }

    let finalCategory = newTaskCat;
    if (showInlineCustomInput) {
      const formatted = customCategoryInput.trim().toLowerCase();
      if (formatted) {
        if (!categories.includes(formatted)) {
          setCategories(prev => [...prev, formatted]);
        }
        finalCategory = formatted;
      } else {
        alert("Please enter a valid tag name or select an existing option.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api.post<Goal>("/goals", {
        title: `[${finalCategory.toUpperCase()}] ${newGoalTitle}`,
        target_date: newGoalDate,
      });
      addGoal(res.data);
      setNewGoalTitle("");
      setCustomCategoryInput("");
      setShowInlineCustomInput(false);
      setNewTaskCat("learning");
      setShowGoalForm(false);
    } catch (err) {
      console.error("Failed to add goal:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = async (goal: Goal) => {
    const completed = !goal.completed_at;
    updateGoal(goal.id, { completed_at: completed ? new Date().toISOString() : null });
    try {
      await api.patch(`/goals/${goal.id}`, { completed });
    } catch (err) {
      updateGoal(goal.id, { completed_at: goal.completed_at });
      console.error("Failed to update goal:", err);
    }
  };

  const deleteGoal = async (id: string) => {
    removeGoal(id);
    try {
      await api.delete(`/goals/${id}`);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  // Calendar click handler – only future/today (uses real date)
  const handleDayCellClick = (day: number) => {
    setSelectedAgendaDay(day);
    const clickedDate = new Date(displayYear, displayMonth, day);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (clickedDate < todayMidnight) return; // past dates cannot be clicked to add

    const dayEvents = events.filter(e => {
      const d = new Date(e.start_dt);
      return d.getDate() === day && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
    });
    const dayGoals = goals.filter(g => {
      const d = new Date(g.target_date);
      return d.getDate() === day && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
    });
    if (dayEvents.length > 0 || dayGoals.length > 0) {
      setSelectedDayInspector(day);
    } else {
      const yyyy = displayYear;
      const mm = String(displayMonth + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      setNewGoalDate(`${yyyy}-${mm}-${dd}`);
      setShowGoalForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  };

  // Reminders (goals due within 3 days from today)
  const activeReminders = goals.filter(goal => {
    if (goal.completed_at) return false;
    const targetDateObj = new Date(goal.target_date);
    const targetYear = targetDateObj.getFullYear();
    const targetMonth = targetDateObj.getMonth();
    const targetDay = targetDateObj.getDate();
    if (targetYear !== currentYear || targetMonth !== currentMonth) return false;
    const diff = targetDay - currentDayNumber;
    return diff >= 0 && diff <= 3;
  });

  // Inspector data for popup
  const inspectorGoals = selectedDayInspector
    ? goals.filter(g => {
        const d = new Date(g.target_date);
        return d.getDate() === selectedDayInspector && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
      })
    : [];
  const inspectorEvents = selectedDayInspector
    ? events.filter(e => {
        const d = new Date(e.start_dt);
        return d.getDate() === selectedDayInspector && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
      })
    : [];

  // Side agenda data
  const sideAgendaGoals = goals.filter(g => {
    const d = new Date(g.target_date);
    return d.getDate() === selectedAgendaDay && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
  });
  const sideAgendaEvents = events.filter(e => {
    const d = new Date(e.start_dt);
    return d.getDate() === selectedAgendaDay && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-xs font-mono font-black uppercase text-neutral-400 tracking-widest">
        Loading operational boards...
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10 text-left">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" style={{ backgroundImage: `linear-gradient(to right, #1A1A1A 1px, transparent 1px),linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="relative z-10 mx-auto w-full max-w-6xl flex flex-col rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden p-6 space-y-6">

        {/* reminders banner */}
        {activeReminders.length > 0 && (
          <div className="flex items-start gap-3 rounded-none border-2 border-black bg-amber-50 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-in fade-in">
            <div className="mt-0.5 shrink-0 rounded-none border-2 border-black bg-white p-2 text-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
              <Bell className="h-4 w-4 fill-black/10 stroke-[2.5px]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-black">Workspace Reminders & Flags</h3>
              <div className="mt-1.5 space-y-1">
                {activeReminders.map(r => {
                  const diff = new Date(r.target_date).getDate() - currentDayNumber;
                  return (
                    <p key={r.id} className="text-xs text-neutral-800 font-sans font-medium">
                      • <span className="font-mono font-black text-amber-600">[{diff === 0 ? "DUE TODAY" : `${diff} DAYS LEFT`}]</span> {r.title}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* header */}
        <div className="flex flex-col justify-between gap-4 border-b-2 border-black pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-black shrink-0" />
              <h1 className="text-xl font-mono font-black uppercase tracking-wider text-black">Career Delivery Hub</h1>
            </div>
            <p className="text-xs font-sans text-neutral-600 mt-0.5">Manage ongoing board applications, milestone target settings, and task deadlines.</p>
          </div>

          {activeTab === "kanban" && (
            <Button onClick={() => setShowAppForm(!showAppForm)} size="sm" className="flex h-10 items-center gap-2 rounded-none border-2 border-black bg-primary px-4 text-xs font-mono font-black uppercase text-primary-foreground shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4 stroke-[3px]" />
              {showAppForm ? "Close Form" : "Add application"}
            </Button>
          )}

          {(activeTab === "calendar" || activeTab === "goals") && (
            <Button
              onClick={() => { setShowGoalForm(!showGoalForm); setShowInlineCustomInput(false); setCustomCategoryInput(""); }}
              size="sm"
              className={cn(
                "flex h-10 items-center gap-2 rounded-none border-2 px-4 text-xs font-mono font-black uppercase transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]",
                showGoalForm
                  ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                  : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {showGoalForm ? <X className="h-4 w-4 stroke-[3px]" /> : <Plus className="h-4 w-4 stroke-[3px]" />}
              {showGoalForm ? "Close" : "Add Goal"}
            </Button>
          )}
        </div>

        {/* forms */}
        <div ref={formRef} className="space-y-4">
          {showAppForm && (
            <div className="rounded-none border-2 border-black bg-neutral-50 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-2 duration-200">
              <form onSubmit={handleAddApplication} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Role Title</Label>
                  <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Frontend Developer" className="w-full rounded-none border-2 border-black bg-white px-3 py-1.5 text-xs text-black focus-visible:ring-0 focus-visible:ring-offset-0" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Company Name</Label>
                  <Input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="e.g. Stripe" className="w-full rounded-none border-2 border-black bg-white px-3 py-1.5 text-xs text-black focus-visible:ring-0 focus-visible:ring-offset-0" required />
                </div>
                <Button type="submit" disabled={saving} size="sm" className="h-10 rounded-none border-2 border-black bg-primary text-xs font-mono font-black uppercase text-primary-foreground hover:bg-primary/90 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  {saving ? "…" : "Add Application"}
                </Button>
              </form>
            </div>
          )}

          {showGoalForm && (
            <div className="rounded-none border-2 border-black bg-neutral-50 p-5 shadow-[2px_2px_0px_rgba(0,0,0,1)] space-y-4 animate-in slide-in-from-top-2 duration-200">
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Goal Description</Label>
                    <Input value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="Finish comprehensive roadmap milestones..." className="w-full bg-white border-2 border-black rounded-none h-10 text-xs text-black focus-visible:ring-0 focus-visible:ring-offset-0" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Target Date</Label>
                    <Input type="date" value={newGoalDate} min={todayStr} onChange={(e) => setNewGoalDate(e.target.value)} className="w-full bg-white border-2 border-black rounded-none h-10 text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Select Active Scope</Label>
                  <select
                    value={showInlineCustomInput ? "ADD_NEW_OPTION_TRIGGER" : newTaskCat}
                    onChange={e => handleDropdownCategoryChange(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-none h-10 px-3 text-xs font-mono font-black uppercase tracking-tight text-black focus:outline-none capitalize"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="ADD_NEW_OPTION_TRIGGER" className="text-neutral-500 font-mono">+ Add Option</option>
                  </select>
                </div>

                {showInlineCustomInput && (
                  <div className="pt-1 flex flex-col gap-1.5 w-full max-w-xs animate-in slide-in-from-top-1 duration-150">
                    <Label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Enter New Tag Option Name</Label>
                    <Input type="text" value={customCategoryInput} onChange={e => setCustomCategoryInput(e.target.value)} placeholder="e.g. system design, interview prep" className="bg-white border-2 border-black rounded-none h-10 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 w-full" required />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="bg-red-600 text-white hover:bg-red-700 border-2 border-black rounded-none h-10 text-xs font-mono font-black uppercase px-5 shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5 stroke-[3px]" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-black rounded-none h-10 text-xs font-mono font-black uppercase px-6 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    {saving ? "…" : "Add Goal"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* tab selector */}
        <div className="flex max-w-md gap-1.5 rounded-none border-2 border-black bg-neutral-100 p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <button onClick={() => setActiveTab("kanban")} className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-black uppercase rounded-none transition-all border-2", activeTab === "kanban" ? "bg-primary text-primary-foreground border-primary shadow-[1px_1px_0px_rgba(0,0,0,0.2)]" : "bg-transparent text-neutral-600 border-transparent hover:text-black")}>
            <KanbanSquare className="h-3.5 w-3.5 shrink-0" />
            <span>Applications</span>
          </button>
          <button onClick={() => setActiveTab("calendar")} className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-black uppercase rounded-none transition-all border-2", activeTab === "calendar" ? "bg-primary text-primary-foreground border-primary shadow-[1px_1px_0px_rgba(0,0,0,0.2)]" : "bg-transparent text-neutral-600 border-transparent hover:text-black")}>
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>Calendar</span>
          </button>
          <button onClick={() => setActiveTab("goals")} className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-black uppercase rounded-none transition-all border-2", activeTab === "goals" ? "bg-primary text-primary-foreground border-primary shadow-[1px_1px_0px_rgba(0,0,0,0.2)]" : "bg-transparent text-neutral-600 border-transparent hover:text-black")}>
            <Target className="h-3.5 w-3.5 shrink-0" />
            <span>Goals</span>
            <Badge className="ml-1 h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-white border border-black text-black font-mono font-black rounded-none shrink-0">
              {goals.filter(t => !t.completed_at).length}
            </Badge>
          </button>
        </div>

        {/* content panels */}
        <div className="pt-2">
          {activeTab === "kanban" && (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {COLUMNS.map((col) => {
                const columnApps = applications.filter((app) => app.status === col.id);
                return (
                  <div key={col.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)} className="flex min-w-[260px] flex-1 flex-col gap-3 rounded-none border-2 border-black bg-neutral-50 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors duration-150">
                    <div className="flex items-center gap-2 px-1">
                      <span className={`h-2.5 w-2.5 rounded-none border-2 border-black ${col.color}`} />
                      <span className="font-mono font-black text-xs text-black uppercase tracking-wider">{col.label}</span>
                      <Badge className="ml-auto font-mono text-xs font-black bg-white border-2 border-black text-black px-2 py-0 rounded-none shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                        {columnApps.length}
                      </Badge>
                    </div>
                    <div className="min-h-[380px] flex-1 space-y-3 rounded-none border-2 border-black bg-white p-2 transition-all">
                      {columnApps.map((app) => (
                        <div key={app.id} draggable onDragStart={(e) => handleDragStart(e, app.id)} className="space-y-2 rounded-none border-2 border-black bg-white p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 cursor-grab active:cursor-grabbing group transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-sans font-black text-black">{app.role}</h4>
                              <p className="text-[11px] font-sans font-bold text-neutral-600 mt-0.5">{app.company}</p>
                            </div>
                            <GripVertical className="h-3.5 w-3.5 text-neutral-300 group-hover:text-black transition-colors shrink-0" />
                          </div>
                          {app.deadline && <p className="text-[10px] text-neutral-500 font-mono">Due: {app.deadline}</p>}
                        </div>
                      ))}
                      {columnApps.length === 0 && (
                        <div className="h-full min-h-[120px] flex items-center justify-center text-center text-[10px] font-mono font-black uppercase text-neutral-300 tracking-wider">
                          Drop space empty
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Dynamic calendar grid */}
              <div className="lg:col-span-2 rounded-none border-2 border-black bg-white p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-3">
                  <button
                    onClick={goPrevMonth}
                    className="p-1 border-2 border-black bg-white shadow-[1px_1px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-mono font-black text-black uppercase tracking-widest">
                    {monthNames[displayMonth]} {displayYear}
                  </span>
                  <button
                    onClick={goNextMonth}
                    className="p-1 border-2 border-black bg-white shadow-[1px_1px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono font-black uppercase text-black mb-2">
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="p-2 min-h-20 border-2 border-black bg-neutral-50 opacity-30" />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dayEvents = events.filter(e => {
                      const d = new Date(e.start_dt);
                      return d.getDate() === day && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
                    });
                    const dayGoals = goals.filter(g => {
                      const d = new Date(g.target_date);
                      return d.getDate() === day && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
                    });
                    const isPast = (() => {
                      const cellDate = new Date(displayYear, displayMonth, day);
                      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      return cellDate < todayMidnight;
                    })();
                    return (
                      <div
                        key={day}
                        onClick={() => handleDayCellClick(day)}
                        className={cn(
                          "p-2 min-h-20 border-2 border-black rounded-none text-xs flex flex-col justify-between transition-colors cursor-pointer",
                          day === selectedAgendaDay ? "bg-neutral-50 ring-2 ring-black ring-offset-1" : "bg-white hover:bg-neutral-50",
                          isPast && "bg-neutral-100/70 opacity-60 cursor-not-allowed"
                        )}
                      >
                        <span className={cn("font-mono font-black", (displayYear === currentYear && displayMonth === currentMonth && day === currentDayNumber) ? "text-rose-600 underline decoration-2 underline-offset-2" : "text-black")}>
                          {day}
                        </span>
                        <div className="text-[8px] space-y-0.5 max-w-full overflow-hidden">
                          {dayGoals.map((g) => (
                            <div key={g.id} className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded-none truncate font-bold border border-amber-300">
                              {g.title}
                            </div>
                          ))}
                          {dayEvents.map((e) => (
                            <div key={e.id} className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded-none truncate font-bold border border-blue-300">
                              {e.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side agenda panel */}
              <div className="rounded-none border-2 border-black bg-neutral-50 p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-4 text-left">
                <div className="border-b-2 border-black pb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-black" />
                  <h3 className="text-xs font-mono font-black uppercase tracking-wider">Day Agenda Overview</h3>
                </div>
                <div>
                  <p className="text-[11px] font-mono font-black uppercase text-neutral-500">Selected Workspace Target:</p>
                  <p className="text-xs font-sans font-black text-black mt-0.5">{monthNames[displayMonth]} {selectedAgendaDay}, {displayYear}</p>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin divide-y divide-black/5">
                  {sideAgendaGoals.length === 0 && sideAgendaEvents.length === 0 ? (
                    <div className="text-center py-8 text-[10px] font-mono font-black uppercase text-neutral-400 tracking-wider">
                      No commitments scheduled
                    </div>
                  ) : (
                    <>
                      {sideAgendaGoals.map(goal => (
                        <div key={goal.id} className="pt-2 first:pt-0 flex items-start gap-2">
                          <div className="mt-0.5" onClick={() => toggleGoal(goal)}>
                            {goal.completed_at ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5px] cursor-pointer" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-neutral-300 stroke-[2.5px] cursor-pointer" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-sans font-bold text-neutral-900 leading-tight", goal.completed_at && "line-through text-neutral-400")}>
                              {goal.title}
                            </p>
                            <Badge className="mt-1 text-[8px] bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0 rounded-none uppercase font-mono font-bold">Goal</Badge>
                          </div>
                        </div>
                      ))}
                      {sideAgendaEvents.map(evt => (
                        <div key={evt.id} className="pt-2 first:pt-0 flex items-start gap-2">
                          <div className="h-2 w-2 mt-1.5 rounded-none bg-blue-500 border border-black shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-sans font-bold text-neutral-900 leading-tight">{evt.title}</p>
                            <Badge className="mt-1 text-[8px] bg-blue-50 text-blue-800 border border-blue-200 px-1 py-0 rounded-none uppercase font-mono font-bold">Timeline Event</Badge>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {(function() {
                  const selectedDateObj = new Date(displayYear, displayMonth, selectedAgendaDay);
                  const isPastSelected = selectedDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  if (!isPastSelected) {
                    return (
                      <Button
                        onClick={() => {
                          const yyyy = displayYear;
                          const mm = String(displayMonth + 1).padStart(2, "0");
                          const dd = String(selectedAgendaDay).padStart(2, "0");
                          setNewGoalDate(`${yyyy}-${mm}-${dd}`);
                          setShowGoalForm(true);
                          setTimeout(() => {
                            formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 50);
                        }}
                        className="w-full h-9 rounded-none border-2 border-black bg-white text-black font-mono font-black uppercase text-[11px] shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100"
                      >
                        + Add Directive
                      </Button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {activeTab === "goals" && (
            <div className="max-w-2xl mx-auto w-full">
              <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden text-left">
                <div className="border-b-2 border-black bg-neutral-50 p-4">
                  <h3 className="text-xs font-mono font-black uppercase tracking-wider">Sprint Directives</h3>
                </div>
                <div className="divide-y-2 divide-black">
                  {goals.map((goal) => {
                    const completed = !!goal.completed_at;
                    return (
                      <div key={goal.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 group transition-colors">
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
                          <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase">
                            {new Date(goal.target_date).toLocaleDateString()}
                          </span>
                          <Button onClick={() => deleteGoal(goal.id)} size="icon" variant="ghost" className="h-7 w-7 text-neutral-300 hover:text-rose-600 rounded-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5 stroke-[2.5px]" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && (
                    <div className="p-8 text-center text-xs font-mono font-black uppercase text-neutral-300 tracking-wider">
                      No milestones listed
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* popup inspector modal */}
      {selectedDayInspector !== null && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col text-left animate-in zoom-in-95 duration-150">
            <div className="bg-neutral-50 border-b-2 border-black p-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-black uppercase tracking-wider text-black">Agenda Inspector</h3>
                <p className="text-[10px] font-sans font-bold text-neutral-500 mt-0.5">{monthNames[displayMonth]} {selectedDayInspector}, {displayYear} Operational Commitments</p>
              </div>
              <button
                onClick={() => setSelectedDayInspector(null)}
                className="h-7 w-7 border-2 border-black flex items-center justify-center bg-white text-black hover:bg-neutral-50 shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-[1px] active:translate-y-[1px]"
              >
                <X className="h-3.5 w-3.5 stroke-[3px]" />
              </button>
            </div>

            <div className="p-4 max-h-[300px] overflow-y-auto divide-y divide-black/10 space-y-3 scrollbar-thin">
              {inspectorGoals.length === 0 && inspectorEvents.length === 0 ? (
                <p className="text-xs text-neutral-400 font-mono font-black uppercase text-center py-4">No logged directives</p>
              ) : (
                <>
                  {inspectorGoals.map(goal => (
                    <div key={goal.id} className="pt-2 first:pt-0 flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0" onClick={() => toggleGoal(goal)}>
                        {goal.completed_at ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 stroke-[2.5px] cursor-pointer" />
                        ) : (
                          <Circle className="h-4 w-4 text-neutral-300 stroke-[2.5px] cursor-pointer" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-sans font-black text-neutral-800", goal.completed_at && "line-through text-neutral-400")}>
                          {goal.title}
                        </p>
                        <span className="inline-block mt-1 font-mono text-[9px] uppercase font-black tracking-wider px-1.5 bg-amber-50 text-amber-700 border border-amber-300">Goal Milestone</span>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} className="text-neutral-300 hover:text-rose-600 px-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {inspectorEvents.map(event => (
                    <div key={event.id} className="pt-2 first:pt-0 flex items-start gap-2.5">
                      <div className="h-2 w-2 mt-1.5 rounded-none bg-blue-500 border border-black shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-sans font-black text-neutral-800">{event.title}</p>
                        <span className="inline-block mt-1 font-mono text-[9px] uppercase font-black tracking-wider px-1.5 bg-blue-50 text-blue-700 border border-blue-300">Timeline Event</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="border-t-2 border-black p-3 bg-neutral-50 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const yyyy = displayYear;
                  const mm = String(displayMonth + 1).padStart(2, "0");
                  const dd = String(selectedDayInspector).padStart(2, "0");
                  setNewGoalDate(`${yyyy}-${mm}-${dd}`);
                  setSelectedDayInspector(null);
                  setShowGoalForm(true);
                  setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }}
                className="h-10 rounded-none border-2 border-black bg-white px-4 text-xs font-mono font-black uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
                <span>Create New Goal</span>
              </Button>
              <Button
                type="button"
                onClick={() => setSelectedDayInspector(null)}
                className="h-10 rounded-none border-2 border-black bg-black px-5 text-xs font-mono font-black uppercase text-white hover:bg-neutral-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto py-12 text-center text-xs font-mono font-black uppercase text-neutral-400 tracking-widest">Loading operational boards...</div>}>
      <TrackerContent />
    </Suspense>
  );
}