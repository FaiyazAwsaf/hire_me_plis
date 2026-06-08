import { create } from "zustand";

export interface DashboardStats {
  applications: {
    total: number;
    by_status: {
      applied: number;
      interviewing: number;
      offer: number;
      rejected: number;
    };
  };
  goals: {
    total: number;
    completed: number;
    completion_pct: number;
  };
  streak_days: number;
  cv_on_file: boolean;
}

export interface Nudge {
  id: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface DashboardState {
  stats: DashboardStats | null;
  nudges: Nudge[];
  unreadCount: number;
  setStats: (stats: DashboardStats) => void;
  setNudges: (nudges: Nudge[], unreadCount: number) => void;
  markNudgeRead: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  stats: null,
  nudges: [],
  unreadCount: 0,
  setStats: (stats) => set({ stats }),
  setNudges: (nudges, unreadCount) => set({ nudges, unreadCount }),
  markNudgeRead: (id) =>
    set((s) => ({
      nudges: s.nudges.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
}));
