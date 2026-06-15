import { create } from "zustand";

export type ApplicationStatus = "shortlist" | "applied" | "interviewing" | "offer" | "rejected";

export interface Application {
  id: string;
  role: string;
  company: string;
  url: string | null;
  status: ApplicationStatus;
  notes: string | null;
  deadline: string | null;
  salary_range: string | null;
  cover_letter_url: string | null;
  jd_text: string | null;
  applied_at: string;
}

export interface Goal {
  id: string;
  title: string;
  target_date: string;
  completed_at: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_dt: string;
  end_dt: string;
  goal_id: string | null;
}

interface TrackerState {
  applications: Application[];
  goals: Goal[];
  events: CalendarEvent[];
  /** True while the initial GET /applications is in flight */
  isLoadingApps: boolean;
  /** True while the initial GET /goals is in flight */
  isLoadingGoals: boolean;
  /** True while the initial GET /calendar/events is in flight */
  isLoadingEvents: boolean;
  /** Last API error for each section, null when clear */
  errorApps: string | null;
  errorGoals: string | null;
  errorEvents: string | null;

  setLoadingApps: (v: boolean) => void;
  setLoadingGoals: (v: boolean) => void;
  setLoadingEvents: (v: boolean) => void;
  setErrorApps: (e: string | null) => void;
  setErrorGoals: (e: string | null) => void;
  setErrorEvents: (e: string | null) => void;

  setApplications: (apps: Application[]) => void;
  addApplication: (app: Application) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  removeApplication: (id: string) => void;

  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  removeEvent: (id: string) => void;
}

export const useTrackerStore = create<TrackerState>()((set) => ({
  applications: [],
  goals: [],
  events: [],
  isLoadingApps:   true,
  isLoadingGoals:  true,
  isLoadingEvents: true,
  errorApps:   null,
  errorGoals:  null,
  errorEvents: null,

  setLoadingApps:   (v) => set({ isLoadingApps: v }),
  setLoadingGoals:  (v) => set({ isLoadingGoals: v }),
  setLoadingEvents: (v) => set({ isLoadingEvents: v }),
  setErrorApps:   (e) => set({ errorApps: e }),
  setErrorGoals:  (e) => set({ errorGoals: e }),
  setErrorEvents: (e) => set({ errorEvents: e }),

  setApplications: (applications) => set({ applications }),
  addApplication: (app) => set((s) => ({ applications: [app, ...s.applications] })),
  updateApplicationStatus: (id, status) =>
    set((s) => ({
      applications: s.applications.map((a) => (a.id === id ? { ...a, status } : a)),
    })),
  updateApplication: (id, updates) =>
    set((s) => ({
      applications: s.applications.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeApplication: (id) =>
    set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),

  setGoals: (goals) => set({ goals }),
  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
  updateGoal: (id, updates) =>
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),
  removeGoal: (id) =>
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

  setEvents: (events) => set({ events }),
  addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
  updateEvent: (id, updates) =>
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
  removeEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}));
