"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  ArrowRight,
  ArrowLeft,
  Bell,
  Trash2,
  Clock
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

// Global System Time Parameter Mocked to: June 3, 2026
const CURRENT_DAY_JUNE_2026 = 3;

function TrackerContent() {
  const searchParams = useSearchParams();
  const urlView = searchParams.get("view") as "kanban" | "calendar" | "goals" | null;

  const [activeTab, setActiveTab] = useState<"kanban" | "calendar" | "goals">("kanban");
  const formRef = useRef<HTMLDivElement>(null);
  
  const [applications, setApplications] = useState<JobApplication[]>([
    { id: "app-1", role: "Software Engineer", company: "Acme Corp", stage: "applied", dateAdded: "June 03, 2026" }
  ]);

  const [tasks, setTasks] = useState<UniversalTask[]>([
    { id: "t-1", text: "Apply to 5 jobs this week", targetDay: 7, category: "applications", status: "todo" },
    { id: "t-2", text: "Finish DSA course by Friday", targetDay: 5, category: "learning", status: "todo" },
    { id: "t-3", text: "Update CV by Sunday", targetDay: 7, category: "cv", status: "completed" }
  ]);

  // Dynamic Categories Array (Extensible by user input)
  const [categories, setCategories] = useState<string[]>(["learning", "applications", "cv"]);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [showInlineCustomInput, setShowInlineCustomInput] = useState(false);

  // Form toggles
  const [showAppForm, setShowAppForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Form state elements
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDay, setNewTaskDay] = useState<number>(CURRENT_DAY_JUNE_2026);
  const [newTaskCat, setNewTaskCat] = useState<string>("learning");

  useEffect(() => {
    if (urlView === "kanban" || urlView === "calendar" || urlView === "goals") {
      setActiveTab(urlView);
    }
  }, [urlView]);

  const moveApplication = (id: string, direction: "next" | "prev") => {
    setApplications(prev => prev.map(app => {
      if (app.id !== id) return app;
      const currentIndex = COLUMNS.findIndex(c => c.id === app.stage);
      let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
        return { ...app, stage: COLUMNS[nextIndex].id };
      }
      return app;
    }));
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

    // Enforce future dates block (dates cannot go back)
    if (Number(newTaskDay) < CURRENT_DAY_JUNE_2026) {
      alert(`Validation Warning: Target day cannot be earlier than today (June ${CURRENT_DAY_JUNE_2026}, 2026).`);
      return;
    }
    
    let finalCategory = newTaskCat;

    // If user typed an inline custom tag, process it on form submit
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

  // Dropdown menu selection state switcher
  const handleDropdownCategoryChange = (val: string) => {
    if (val === "ADD_NEW_OPTION_TRIGGER") {
      setShowInlineCustomInput(true);
      setNewTaskCat("");
    } else {
      setShowInlineCustomInput(false);
      setNewTaskCat(val);
    }
  };

  // Open task creator immediately locked into a clicked day cell from the calendar view
  const handleDayCellClick = (day: number) => {
    if (day < CURRENT_DAY_JUNE_2026) return; // Ignore past days
    setNewTaskDay(day);
    setShowTaskForm(true);
    
    // Automatically smooth-scroll view focus right to the dynamic entry form context
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

  // Reminder Engine calculations (3 days left window)
  const activeReminders = tasks.filter(task => {
    if (task.status === "completed") return false;
    const daysRemaining = task.targetDay - CURRENT_DAY_JUNE_2026;
    return daysRemaining >= 0 && daysRemaining <= 3;
  });

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto p-6 animate-in fade-in duration-200">
      
      {/* Dynamic Header Notification Banner */}
      {activeReminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-in fade-in">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
            <Bell className="h-4 w-4 fill-amber-600/10" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">Workspace Reminders & Flags</h3>
            <div className="mt-1 space-y-1">
              {activeReminders.map(r => {
                const diff = r.targetDay - CURRENT_DAY_JUNE_2026;
                return (
                  <p key={r.id} className="text-xs text-amber-800 font-medium">
                    • <span className="font-bold">[{diff === 0 ? "DUE TODAY" : `${diff} days left`}]</span> {r.text}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Career Delivery Hub</h1>
          <p className="text-xs text-muted-foreground">Manage ongoing board applications, milestone target settings, and task deadlines.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === "kanban" && (
            <Button onClick={() => setShowAppForm(!showAppForm)} size="sm" className="bg-black hover:bg-neutral-800 text-white rounded-xl h-9 px-4 font-semibold text-xs flex items-center gap-1.5 shadow-sm">
              <Plus className="h-4 w-4 shrink-0" />
              <span>{showAppForm ? "Close Form" : "Add application"}</span>
            </Button>
          )}
          {(activeTab === "calendar" || activeTab === "goals") && (
            <Button onClick={() => { setShowTaskForm(!showTaskForm); setNewTaskDay(CURRENT_DAY_JUNE_2026); setShowInlineCustomInput(false); setCustomCategoryInput(""); }} size="sm" className="bg-black hover:bg-neutral-800 text-white rounded-xl h-9 px-4 font-semibold text-xs flex items-center gap-1.5 shadow-sm">
              <Plus className="h-4 w-4 shrink-0" />
              <span>{showTaskForm ? "Close" : "Add Goal"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Dynamic Input Forms Wrapper */}
      <div ref={formRef}>
        {showAppForm && (
          <Card className="p-4 border-neutral-300 rounded-2xl bg-neutral-50/50 animate-in slide-in-from-top-2 duration-200 mb-4">
            <form onSubmit={addApplication} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-500">Role Title</label>
                <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="e.g. Frontend Developer" className="w-full bg-white border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-neutral-400" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-500">Company Name</label>
                <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="e.g. Stripe" className="w-full bg-white border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-neutral-400" required />
              </div>
              <Button type="submit" size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl h-9 text-xs font-bold">
                Add Application
              </Button>
            </form>
          </Card>
        )}

        {showTaskForm && (
          <Card className="p-5 border-neutral-300 rounded-2xl bg-amber-50/10 border-dashed animate-in slide-in-from-top-2 duration-200 mb-4">
            <form onSubmit={addUserTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-neutral-500">Goal / Directive Description</label>
                  <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Finish comprehensive roadmap milestones..." className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-medium focus:outline-neutral-400" required />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-500">Target June Day (Cannot go back)</label>
                  <input type="number" min={CURRENT_DAY_JUNE_2026} max="30" value={newTaskDay} onChange={e => setNewTaskDay(Number(e.target.value))} className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-neutral-400" required />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-500">Select Active Scope</label>
                  <select value={showInlineCustomInput ? "ADD_NEW_OPTION_TRIGGER" : newTaskCat} onChange={e => handleDropdownCategoryChange(e.target.value)} className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold focus:outline-neutral-400 capitalize">
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="ADD_NEW_OPTION_TRIGGER" className="text-neutral-500 font-bold font-mono">+ Add Option</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Extensible Scope/Tag Configurator Inline Field */}
              {showInlineCustomInput && (
                <div className="pt-2 flex flex-col gap-1 w-full max-w-xs animate-in slide-in-from-top-1 duration-150">
                  <label className="text-[10px] font-bold uppercase text-neutral-500">Enter New Tag Option Name</label>
                  <input type="text" value={customCategoryInput} onChange={e => setCustomCategoryInput(e.target.value)} placeholder="e.g. system design, interview prep" className="bg-white border rounded-xl px-3 py-2 text-xs font-medium focus:outline-neutral-400 w-full" required />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl h-9 text-xs font-bold px-6 shadow-sm">
                  Add
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Tabs Layout Navigation Sub-Navbar */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl max-w-md">
        <button onClick={() => setActiveTab("kanban")} className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all", activeTab === "kanban" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900")}>
          <KanbanSquare className="h-3.5 w-3.5" />
          <span>Applications</span>
        </button>
        <button onClick={() => setActiveTab("calendar")} className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all", activeTab === "calendar" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900")}>
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Calendar View</span>
        </button>
        <button onClick={() => setActiveTab("goals")} className={cn("flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all", activeTab === "goals" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900")}>
          <Target className="h-3.5 w-3.5" />
          <span>Goals Engine</span>
          <Badge className="ml-0.5 h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-neutral-900 text-white font-black border-none">
            {tasks.filter(t => t.status === "todo").length}
          </Badge>
        </button>
      </div>

      {/* Content Stream Views */}
      <div className="pt-2">
        
        {/* VIEW 1: KANBAN MODULE */}
        {activeTab === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {COLUMNS.map((col) => {
              const columnApps = applications.filter(app => app.stage === col.id);
              return (
                <div key={col.id} className="flex flex-col gap-3 min-w-[270px] bg-neutral-50/50 border p-3 rounded-2xl flex-1">
                  <div className="flex items-center gap-2 px-1">
                    <span className={`h-2 w-2 rounded-full ${col.color}`} />
                    <span className="font-bold text-xs text-neutral-700 uppercase tracking-wide">{col.label}</span>
                    <Badge variant="secondary" className="ml-auto font-mono text-xs font-bold bg-white border border-neutral-200 text-neutral-600 px-2 py-0">
                      {columnApps.length}
                    </Badge>
                  </div>

                  <div className="flex-1 min-h-[380px] rounded-xl border border-dashed border-neutral-200 bg-white/70 p-2 space-y-2">
                    {columnApps.map((app) => (
                      <Card key={app.id} className="bg-white border border-neutral-200 rounded-xl shadow-sm p-3 space-y-3 animate-in fade-in duration-150">
                        <div>
                          <h4 className="text-xs font-black text-neutral-900">{app.role}</h4>
                          <p className="text-[11px] text-neutral-500 font-medium">{app.company}</p>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2 mt-1">
                          <Button disabled={col.id === "applied"} onClick={() => moveApplication(app.id, "prev")} size="icon" variant="ghost" className="h-6 w-6 rounded-md text-neutral-400 disabled:opacity-20">
                            <ArrowLeft className="h-3 w-3" />
                          </Button>
                          <span className="text-[8px] uppercase tracking-wider font-mono font-black text-neutral-400 bg-neutral-50 px-1 py-0.5 rounded"></span>
                          <Button disabled={col.id === "rejected"} onClick={() => moveApplication(app.id, "next")} size="icon" variant="ghost" className="h-6 w-6 rounded-md text-neutral-400 disabled:opacity-20">
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: CALENDAR VIEW */}
        {activeTab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-3 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <span className="text-sm font-black text-neutral-900">June 2026</span>
                <p className="text-[10px] text-neutral-400 font-medium">✨ Click any day to add To-Do.</p>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase text-neutral-400 mb-2 tracking-wider">
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
                        "p-2 min-h-[76px] border rounded-xl text-xs font-bold flex flex-col justify-between transition-all select-none relative",
                        isPast ? "opacity-40 bg-neutral-100/50 cursor-not-allowed border-neutral-100" : "cursor-pointer hover:border-neutral-300 bg-white border-neutral-200/70 hover:bg-neutral-50/30",
                        day === CURRENT_DAY_JUNE_2026 && "border-neutral-900 shadow-sm ring-1 ring-neutral-900"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("h-5 w-5 flex items-center justify-center rounded-full text-[10px]", day === CURRENT_DAY_JUNE_2026 && "bg-neutral-900 text-white font-black")}>
                          {day}
                        </span>
                        {dayTasks.some(t => t.status === "todo") && (
                          <span className="h-1.5 w-1.5 bg-amber-500 rounded-full block animate-pulse" />
                        )}
                      </div>
                      
                      <div className="space-y-0.5 max-h-10 overflow-hidden mt-1 pointer-events-none">
                        {dayTasks.map(t => (
                          <div key={t.id} className={cn("text-[8px] px-1 py-0.5 rounded truncate font-medium border uppercase tracking-tight", t.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200 line-through" : "bg-neutral-50 border-neutral-200/60 text-neutral-700")}>
                            {t.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Sidebar Agenda List Flow Component */}
            <div className="space-y-4">
              <Card className="rounded-2xl border bg-white p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span>Agenda Flow</span>
                </h3>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  {tasks.map(t => {
                    const daysAway = t.targetDay - CURRENT_DAY_JUNE_2026;
                    const isUrgent = daysAway >= 0 && daysAway <= 3 && t.status === "todo";
                    
                    return (
                      <div key={t.id} className={cn("p-2.5 border rounded-xl flex justify-between gap-3 items-start transition-all", t.status === "completed" ? "bg-neutral-50/50 border-neutral-100 opacity-70" : isUrgent ? "border-amber-200 bg-amber-50/20" : "border-neutral-100 bg-neutral-50/30")}>
                        <div className="space-y-1 flex-1 min-w-0">
                          <h4 className={cn("text-xs font-bold leading-tight truncate", t.status === "completed" ? "line-through text-neutral-400 font-normal" : "text-neutral-800")}>{t.text}</h4>
                          <div className="flex flex-wrap gap-1.5 items-center mt-1">
                            <span className="text-[9px] font-bold font-mono text-neutral-500 uppercase">
                              June {t.targetDay} · {daysAway === 0 ? "Today" : daysAway < 0 ? "Past Due" : `${daysAway}d`}
                            </span>
                            <span className="text-[8px] font-mono font-bold uppercase bg-neutral-200/60 text-neutral-600 px-1 rounded truncate max-w-[70px]">
                              {t.category}
                            </span>
                          </div>
                        </div>
                        
                        {/* Interactive Circle-to-Green-Tick Module Engine */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t.id); }} 
                          className="p-0.5 rounded-md transition-colors shrink-0 mt-0.5"
                        >
                          {t.status === "completed" ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 fill-emerald-50" />
                          ) : (
                            <Circle className={cn("h-4.5 w-4.5 text-neutral-300 hover:text-emerald-600", isUrgent && "text-amber-400")} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW 3: GOALS CHECKLIST MODULE */}
        {activeTab === "goals" && (
          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b bg-neutral-50/40">
                <CardTitle className="text-sm font-bold text-neutral-900">Sprint Directives Checklist</CardTitle>
                <CardDescription className="text-xs"></CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {tasks.map((task) => {
                  const diff = task.targetDay - CURRENT_DAY_JUNE_2026;
                  const warningWindow = diff >= 0 && diff <= 3 && task.status === "todo";
                  
                  return (
                    <div key={task.id} className={cn("flex items-center justify-between p-4 transition-colors group", warningWindow ? "bg-amber-50/10 hover:bg-amber-50/20" : "hover:bg-neutral-50/30")}>
                      <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => toggleTaskStatus(task.id)}>
                        <div className="cursor-pointer shrink-0">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                          ) : (
                            <Circle className={cn("h-4.5 w-4.5", warningWindow ? "text-amber-500" : "text-neutral-300")} />
                          )}
                        </div>
                        <span className={cn("text-xs font-medium truncate transition-colors", task.status === "completed" ? "line-through text-neutral-400 font-normal" : "text-neutral-800 font-bold")}>
                          {task.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 ml-4">
                        {warningWindow && (
                          <Badge className="text-[8px] bg-amber-500 text-white uppercase font-black tracking-wider border-none px-1.5 py-0.5 animate-pulse">
                            Urgent
                          </Badge>
                        )}
                        <Badge className="text-[9px] uppercase font-mono font-black py-0.5 px-2 tracking-wide border-none bg-neutral-100 text-neutral-700 capitalize max-w-[90px] truncate">
                          {task.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono font-bold hidden sm:inline">
                          June {task.targetDay}, 2026
                        </span>
                        <Button onClick={() => deleteTask(task.id)} size="icon" variant="ghost" className="h-7 w-7 text-neutral-300 hover:text-rose-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto py-12 text-center text-xs font-mono text-neutral-400">
        Loading operational boards...
      </div>
    }>
      <TrackerContent />
    </Suspense>
  );
}