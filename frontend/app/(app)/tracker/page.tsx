"use client";

import React, { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type ColumnId = "applied" | "interviewing" | "offer" | "rejected";

interface JobApplication {
  id: string;
  role: string;
  company: string;
  stage: ColumnId;
  dateAdded: string;
}

interface UniversalTask {
  id: string;
  text: string;
  targetDay: number; // Day in June 2026
  category: string;  // Dynamically extensible scope categories
  status: "todo" | "completed";
}

const COLUMNS = [
  { id: "applied",       label: "Applied",       color: "bg-blue-500" },
  { id: "interviewing", label: "Interviewing",  color: "bg-amber-500" },
  { id: "offer",        label: "Offer",         color: "bg-emerald-500" },
  { id: "rejected",     label: "Rejected",      color: "bg-rose-500" },
] as const;

const CURRENT_DAY_JUNE_2026 = 3;

function TrackerContent() {
  const searchParams = useSearchParams();
  const urlView = searchParams.get("view") as "kanban" | "calendar" | "goals" | null;

  const [activeTab, setActiveTab] = useState<"kanban" | "calendar" | "goals">(
    urlView === "kanban" || urlView === "calendar" || urlView === "goals" ? urlView : "kanban"
  );
  const formRef = useRef<HTMLDivElement>(null);
  
  const [applications, setApplications] = useState<JobApplication[]>([
    { id: "app-1", role: "Software Engineer", company: "Acme Corp", stage: "applied", dateAdded: "June 03, 2026" },
    { id: "app-2", role: "Product Designer", company: "Stripe", stage: "interviewing", dateAdded: "June 03, 2026" }
  ]);

  const [tasks, setTasks] = useState<UniversalTask[]>([
    { id: "t-1", text: "Apply to 5 jobs this week", targetDay: 7, category: "applications", status: "todo" },
    { id: "t-2", text: "Finish DSA course by Friday", targetDay: 5, category: "learning", status: "todo" },
    { id: "t-3", text: "Update CV by Sunday", targetDay: 7, category: "cv", status: "completed" }
  ]);

  const [categories, setCategories] = useState<string[]>(["learning", "applications", "cv"]);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [showInlineCustomInput, setShowInlineCustomInput] = useState(false);

  const [showAppForm, setShowAppForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDay, setNewTaskDay] = useState<number>(CURRENT_DAY_JUNE_2026);
  const [newTaskCat, setNewTaskCat] = useState<string>("learning");

  // Track currently dragged item
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  /* --- DRAG & DROP UTILITIES --- */
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow landing dropped files/elements
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: ColumnId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedAppId;
    if (!id) return;

    setApplications(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, stage: targetColumnId };
      }
      return app;
    }));
    setDraggedAppId(null);
  };

  const addApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole || !newCompany) return;
    const newId = `app-${Date.now()}`;
    
    setApplications(prev => [...prev, {
      id: newId,
      role: newRole,
      company: newCompany,
      stage: "applied",
      dateAdded: "June 03, 2026"
    }]);

    setNewRole("");
    setNewCompany("");
    setShowAppForm(false);
  };

  const addUserTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText) return;

    if (Number(newTaskDay) < CURRENT_DAY_JUNE_2026) {
      alert(`Validation Warning: Target day cannot be earlier than today (June ${CURRENT_DAY_JUNE_2026}, 2026).`);
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

    setTasks(prev => [...prev, {
      id: `t-${Date.now()}`,
      text: newTaskText,
      targetDay: Number(newTaskDay),
      category: finalCategory,
      status: "todo"
    }]);

    setNewTaskText("");
    setCustomCategoryInput("");
    setShowInlineCustomInput(false);
    setNewTaskCat("learning");
    setShowTaskForm(false);
  };

  const handleDropdownCategoryChange = (val: string) => {
    if (val === "ADD_NEW_OPTION_TRIGGER") {
      setShowInlineCustomInput(true);
      setNewTaskCat("");
    } else {
      setShowInlineCustomInput(false);
      setNewTaskCat(val);
    }
  };

  const handleDayCellClick = (day: number) => {
    if (day < CURRENT_DAY_JUNE_2026) return;
    setNewTaskDay(day);
    setShowTaskForm(true);
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "todo" ? "completed" : "todo" } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const activeReminders = tasks.filter(task => {
    if (task.status === "completed") return false;
    const daysRemaining = task.targetDay - CURRENT_DAY_JUNE_2026;
    return daysRemaining >= 0 && daysRemaining <= 3;
  });

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10 select-none text-left">
      
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

      {/* CORE WORKSPACE SYSTEM PANEL COMPONENT */}
      <div className="relative z-10 mx-auto w-full max-w-5xl flex flex-col rounded-none border border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden p-6 space-y-6">
        
        {/* Notifications */}
        {activeReminders.length > 0 && (
          <div className="flex items-start gap-3 rounded-none border border-black bg-amber-50 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-in fade-in">
            <div className="mt-0.5 shrink-0 rounded-none border border-black bg-white p-2 text-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
              <Bell className="h-4 w-4 fill-black/10 stroke-[2.5px]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-black">Workspace Reminders & Flags</h3>
              <div className="mt-1.5 space-y-1">
                {activeReminders.map(r => {
                  const diff = r.targetDay - CURRENT_DAY_JUNE_2026;
                  return (
                    <p key={r.id} className="text-xs text-neutral-800 font-sans font-medium">
                      • <span className="font-mono font-black text-amber-600">[{diff === 0 ? "DUE TODAY" : `${diff} DAYS LEFT`}]</span> {r.text}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Hero Headers */}
        <div className="flex flex-col justify-between gap-4 border-b border-black pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-black shrink-0" />
              <h1 className="text-xl font-mono font-black uppercase tracking-wider text-black">Career Delivery Hub</h1>
            </div>
            <p className="text-xs font-sans text-neutral-500 mt-0.5">Manage ongoing board applications, milestone target settings, and task deadlines.</p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === "kanban" && (
              <Button 
                onClick={() => setShowAppForm(!showAppForm)} 
                size="sm" 
                className="flex h-10 items-center gap-2 rounded-none border border-black bg-black px-4 text-xs font-mono font-black uppercase text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 transition-colors"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
                <span>{showAppForm ? "Close Form" : "Add application"}</span>
              </Button>
            )}
            {(activeTab === "calendar" || activeTab === "goals") && (
              <Button 
                onClick={() => { setShowTaskForm(!showTaskForm); setNewTaskDay(CURRENT_DAY_JUNE_2026); setShowInlineCustomInput(false); setCustomCategoryInput(""); }} 
                size="sm" 
                className="flex h-10 items-center gap-2 rounded-none border border-black bg-black px-4 text-xs font-mono font-black uppercase text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 transition-colors"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
                <span>{showTaskForm ? "Close" : "Add Goal"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Form Components Wrapper */}
        <div ref={formRef}>
          {showAppForm && (
            <div className="mb-4 rounded-none border border-black bg-neutral-50 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-2 duration-200">
              <form onSubmit={addApplication} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Role Title</label>
                  <Input 
                    value={newRole} 
                    onChange={e => setNewRole(e.target.value)} 
                    placeholder="e.g. Frontend Developer" 
                    className="w-full rounded-none border border-black bg-white px-3 py-1.5 text-xs text-black focus-visible:ring-0 focus-visible:ring-offset-0" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Company Name</label>
                  <Input 
                    value={newCompany} 
                    onChange={e => setNewCompany(e.target.value)} 
                    placeholder="e.g. Stripe" 
                    className="w-full rounded-none border border-black bg-white px-3 py-1.5 text-xs text-black focus-visible:ring-0 focus-visible:ring-offset-0" 
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  size="sm" 
                  className="h-10 rounded-none border border-black bg-black text-xs font-mono font-black uppercase text-white hover:bg-neutral-800 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                >
                  Add Application
                </Button>
              </form>
            </div>
          )}

          {showTaskForm && (
            <div className="mb-4 rounded-none border border-black bg-neutral-50 p-5 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-2 duration-200">
              <form onSubmit={addUserTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Goal Description</label>
                    <Input 
                      value={newTaskText} 
                      onChange={e => setNewTaskText(e.target.value)} 
                      placeholder="Finish comprehensive roadmap milestones..." 
                      className="w-full bg-white border border-black rounded-none h-10 text-xs text-black focus-visible:ring-0 focus-visible:ring-offset-0" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Target June Day</label>
                    <Input 
                      type="number" 
                      min={CURRENT_DAY_JUNE_2026} 
                      max="30" 
                      value={newTaskDay} 
                      onChange={e => setNewTaskDay(Number(e.target.value))} 
                      className="w-full bg-white border border-black rounded-none h-10 text-xs font-mono font-black focus-visible:ring-0 focus-visible:ring-offset-0" 
                      required 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Select Active Scope</label>
                    <select 
                      value={showInlineCustomInput ? "ADD_NEW_OPTION_TRIGGER" : newTaskCat} 
                      onChange={e => handleDropdownCategoryChange(e.target.value)} 
                      className="w-full bg-white border border-black rounded-none h-10 px-3 text-xs font-mono font-black uppercase tracking-tight text-black focus:outline-none capitalize"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="ADD_NEW_OPTION_TRIGGER" className="text-neutral-500 font-mono">+ Add Option</option>
                    </select>
                  </div>
                </div>

                {showInlineCustomInput && (
                  <div className="pt-1 flex flex-col gap-1.5 w-full max-w-xs animate-in slide-in-from-top-1 duration-150">
                    <label className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-500">Enter New Tag Option Name</label>
                    <Input 
                      type="text" 
                      value={customCategoryInput} 
                      onChange={e => setCustomCategoryInput(e.target.value)} 
                      placeholder="e.g. system design, interview prep" 
                      className="bg-white border border-black rounded-none h-10 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 w-full" 
                      required 
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="bg-black text-white hover:bg-neutral-800 border border-black rounded-none h-10 text-xs font-mono font-black uppercase px-6 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                  >
                    Add
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Tab Selector Bar */}
        <div className="flex max-w-md gap-1.5 rounded-none border border-black bg-neutral-100 p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <button 
            onClick={() => setActiveTab("kanban")} 
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-black uppercase rounded-none transition-all border border-transparent", 
              activeTab === "kanban" ? "bg-black text-white border-black shadow-[1px_1px_0px_rgba(0,0,0,0.2)]" : "text-neutral-600 hover:text-black"
            )}
          >
            <KanbanSquare className="h-3.5 w-3.5 shrink-0" />
            <span>Applications</span>
          </button>
          <button 
            onClick={() => setActiveTab("calendar")} 
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-black uppercase rounded-none transition-all border border-transparent", 
              activeTab === "calendar" ? "bg-black text-white border-black shadow-[1px_1px_0px_rgba(0,0,0,0.2)]" : "text-neutral-600 hover:text-black"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>Calendar View</span>
          </button>
          <button 
            onClick={() => setActiveTab("goals")} 
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-black uppercase rounded-none transition-all border border-transparent", 
              activeTab === "goals" ? "bg-black text-white border-black shadow-[1px_1px_0px_rgba(0,0,0,0.2)]" : "text-neutral-600 hover:text-black"
            )}
          >
            <Target className="h-3.5 w-3.5 shrink-0" />
            <span>Goals Engine</span>
            <Badge className="ml-1 h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-white border border-black text-black font-mono font-black rounded-none shrink-0">
              {tasks.filter(t => t.status === "todo").length}
            </Badge>
          </button>
        </div>

        {/* Workspace Views Panels */}
        <div className="pt-2">
          
          {/* VIEW 1: DRAGGABLE KANBAN MODULE */}
          {activeTab === "kanban" && (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {COLUMNS.map((col) => {
                const columnApps = applications.filter(app => app.stage === col.id);
                return (
                  <div 
                    key={col.id} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className="flex min-w-[260px] flex-1 flex-col gap-3 rounded-none border border-black bg-neutral-50 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors duration-150 target-drop-zone"
                  >
                    <div className="flex items-center gap-2 px-1">
                      <span className={`h-2.5 w-2.5 rounded-none border border-black ${col.color}`} />
                      <span className="font-mono font-black text-xs text-black uppercase tracking-wider">{col.label}</span>
                      <Badge className="ml-auto font-mono text-xs font-black bg-white border border-black text-black px-2 py-0 rounded-none shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                        {columnApps.length}
                      </Badge>
                    </div>

                    <div className="min-h-[380px] flex-1 space-y-3 rounded-none border border-black bg-white p-2 transition-all">
                      {columnApps.map((app) => (
                        <div 
                          key={app.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          className="space-y-2 rounded-none border border-black bg-white p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:scale-[0.98] active:shadow-none cursor-grab active:cursor-grabbing hover:bg-neutral-50 group/card relative transition-all animate-in fade-in duration-150"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-sans font-black text-black leading-tight">{app.role}</h4>
                              <p className="text-[11px] font-sans font-bold text-neutral-500 mt-0.5">{app.company}</p>
                            </div>
                            <GripVertical className="h-3.5 w-3.5 text-neutral-300 group-hover/card:text-black transition-colors shrink-0 mt-0.5" />
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-dashed border-neutral-300 pt-2 mt-1">
                            <span className="text-[8px] uppercase font-mono font-black text-neutral-400">June 03</span>
                            <span className="text-[8px] uppercase font-mono font-black text-neutral-400 tracking-tighter bg-neutral-100 border px-1 py-0.5">DRAG ME</span>
                          </div>
                        </div>
                      ))}

                      {columnApps.length === 0 && (
                        <div className="h-full min-h-[120px] flex items-center justify-center text-center p-4 border border-dashed border-neutral-200 text-[10px] font-mono font-black uppercase text-neutral-300 tracking-wider">
                          Drop space empty
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: CALENDAR VIEW */}
          {activeTab === "calendar" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="rounded-none border border-black bg-white p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] lg:col-span-3">
                <div className="flex items-center justify-between mb-4 border-b border-black pb-3">
                  <span className="text-sm font-mono font-black text-black uppercase tracking-wider">June 2026</span>
                  <p className="text-[10px] font-mono font-black text-neutral-400 uppercase">⚡ Click day cell to anchor goal</p>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono font-black uppercase text-black mb-2 tracking-widest">
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                    const dayTasks = tasks.filter(t => t.targetDay === day);
                    const isPast = day < CURRENT_DAY_JUNE_2026;
                    
                    return (
                      <div 
                        key={day} 
                        onClick={() => handleDayCellClick(day)}
                        className={cn(
                          "p-2 min-h-[80px] border rounded-none text-xs flex flex-col justify-between transition-all select-none relative",
                          isPast 
                            ? "opacity-30 bg-neutral-100 cursor-not-allowed border-neutral-200" 
                            : "cursor-pointer hover:border-black bg-white border-neutral-300 hover:bg-neutral-50",
                          day === CURRENT_DAY_JUNE_2026 && "border-black bg-neutral-50 shadow-[2px_2px_0px_rgba(0,0,0,1)] font-black"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "h-5 w-5 flex items-center justify-center rounded-none text-[10px] font-mono font-bold border border-transparent", 
                            day === CURRENT_DAY_JUNE_2026 && "bg-black text-white font-black border-black"
                          )}>
                            {day}
                          </span>
                          {dayTasks.some(t => t.status === "todo") && (
                            <span className="h-2 w-2 bg-amber-500 rounded-none border border-black block" />
                          )}
                        </div>
                        
                        <div className="space-y-0.5 max-h-12 overflow-hidden mt-1.5 pointer-events-none">
                          {dayTasks.map(t => (
                            <div 
                              key={t.id} 
                              className={cn(
                                "text-[8px] px-1 py-0.5 rounded-none truncate font-mono font-bold border uppercase tracking-tighter", 
                                t.status === "completed" 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 line-through opacity-60" 
                                  : "bg-neutral-100 border-neutral-300 text-black"
                              )}
                            >
                              {t.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Agenda List Loop Stream */}
              <div className="space-y-4">
                <div className="rounded-none border border-black bg-neutral-50 p-4 space-y-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-xs font-mono font-black uppercase text-black tracking-widest flex items-center gap-2 border-b border-black pb-2">
                    <Clock className="h-4 w-4 text-black stroke-[2.5px]" />
                    <span>Agenda Flow</span>
                  </h3>
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {tasks.map(t => {
                      const daysAway = t.targetDay - CURRENT_DAY_JUNE_2026;
                      const isUrgent = daysAway >= 0 && daysAway <= 3 && t.status === "todo";
                      
                      return (
                        <div 
                          key={t.id} 
                          className={cn(
                            "flex items-start justify-between gap-3 rounded-none border border-black p-2.5 transition-all bg-white shadow-[1px_1px_0px_rgba(0,0,0,1)]", 
                            t.status === "completed" ? "opacity-60 bg-neutral-50 border-neutral-300 shadow-none" : isUrgent ? "bg-amber-50" : "bg-white"
                          )}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className={cn("text-xs font-sans font-black leading-tight truncate text-black", t.status === "completed" && "line-through font-medium text-neutral-400")}>{t.text}</h4>
                            <div className="flex flex-wrap gap-1.5 items-center mt-1">
                              <span className="text-[9px] font-mono font-black text-neutral-500 uppercase">
                                Jun {t.targetDay} · {daysAway === 0 ? "Today" : daysAway < 0 ? "Past" : `${daysAway}d`}
                              </span>
                              <span className="text-[8px] font-mono font-black uppercase bg-neutral-200 text-neutral-700 px-1 rounded-none border border-neutral-300 truncate max-w-[80px]">
                                {t.category}
                              </span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t.id); }} 
                            className="p-0.5 rounded-none transition-colors shrink-0 mt-0.5"
                          >
                            {t.status === "completed" ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 fill-emerald-50 stroke-[2.5px]" />
                            ) : (
                              <Circle className={cn("h-4.5 w-4.5 text-neutral-300 hover:text-black stroke-[2.5px]", isUrgent && "text-amber-500")} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: GOALS CHECKLIST MODULE */}
          {activeTab === "goals" && (
            <div className="max-w-2xl mx-auto">
              <div className="overflow-hidden rounded-none border border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="border-b border-black bg-neutral-50 p-4">
                  <h3 className="text-xs font-mono font-black uppercase tracking-widest text-black">Sprint Directives Checklist</h3>
                </div>
                <div className="p-0 divide-y-2 divide-black bg-white">
                  {tasks.map((task) => {
                    const diff = task.targetDay - CURRENT_DAY_JUNE_2026;
                    const warningWindow = diff >= 0 && diff <= 3 && task.status === "todo";
                    
                    return (
                      <div 
                        key={task.id} 
                        className={cn(
                          "flex items-center justify-between p-4 transition-colors group", 
                          warningWindow ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-neutral-50"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleTaskStatus(task.id)}>
                          <div className="shrink-0">
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 stroke-[2.5px]" />
                            ) : (
                              <Circle className={cn("h-4.5 w-4.5 stroke-[2.5px]", warningWindow ? "text-amber-500" : "text-neutral-300")} />
                            )}
                          </div>
                          <span className={cn("text-xs font-sans font-black text-black truncate transition-colors", task.status === "completed" && "line-through text-neutral-400 font-medium")}>
                            {task.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          {warningWindow && (
                            <Badge className="text-[8px] bg-amber-500 text-white font-mono font-black uppercase tracking-wider border border-black rounded-none px-1.5 py-0.5">
                              Urgent
                            </Badge>
                          )}
                          <Badge className="text-[9px] font-mono font-black uppercase py-0.5 px-2 tracking-wide border border-black bg-neutral-100 text-neutral-700 rounded-none max-w-[90px] truncate capitalize">
                            {task.category}
                          </Badge>
                          <span className="text-[10px] text-neutral-500 font-mono font-bold hidden sm:inline">
                            June {task.targetDay}, 2026
                          </span>
                          <Button 
                            onClick={() => deleteTask(task.id)} 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-neutral-300 hover:text-rose-600 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                          >
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
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense 
      fallback={
        <div className="max-w-5xl mx-auto py-12 text-center text-xs font-mono font-black uppercase text-neutral-400 tracking-widest">
          Loading operational boards...
        </div>
      }
    >
      <TrackerContent />
    </Suspense>
  );
}