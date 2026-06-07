import { create } from "zustand";

export interface JobCard {
  id: string;
  role: string;
  company: string;
  location: string;
  salary_range: string | null;
  deadline: string | null;
  url: string;
  source_platform: string | null;
  fit_score: number;
  fit_reasoning: string;
  missing_skills: string[];
}

interface JobsState {
  results: JobCard[];
  source: string | null;
  total: number;
  isSearching: boolean;
  query: string;
  setResults: (results: JobCard[], source: string | null, total: number) => void;
  setSearching: (v: boolean) => void;
  setQuery: (q: string) => void;
  clear: () => void;
}

export const useJobsStore = create<JobsState>()((set) => ({
  results: [],
  source: null,
  total: 0,
  isSearching: false,
  query: "",
  setResults: (results, source, total) => set({ results, source, total }),
  setSearching: (v) => set({ isSearching: v }),
  setQuery: (q) => set({ query: q }),
  clear: () => set({ results: [], source: null, total: 0, query: "" }),
}));
