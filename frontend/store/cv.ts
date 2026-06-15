import { create } from "zustand";

export type CvStatus = "pending" | "processing" | "embedding" | "done" | "error";

export interface CvMeta {
  cvId: string;
  filename: string;
  uploadedAt: string;
  status: CvStatus;
}

export interface CvProfile {
  personal: {
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    github: string | null;
    summary: string | null;
  };
  experience: Array<{
    id: string;
    role: string;
    company: string;
    start_date: string;
    end_date: string | null;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    start_date: string;
    end_date: string | null;
    grade: string | null;
  }>;
  skills: string[];
  projects: Array<{
    id: string;
    name: string;
    description: string;
    url: string | null;
    tech_stack: string[];
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string | null;
    url: string | null;
  }>;
  updated_at: string;
}

interface CvState {
  meta: CvMeta | null;
  profile: CvProfile | null;
  isUploading: boolean;
  setMeta: (meta: CvMeta) => void;
  setStatus: (status: CvStatus) => void;
  setProfile: (profile: CvProfile) => void;
  setUploading: (v: boolean) => void;
  clear: () => void;
}

export const useCvStore = create<CvState>()((set) => ({
  meta: null,
  profile: null,
  isUploading: false,
  setMeta: (meta) => set({ meta }),
  setStatus: (status) =>
    set((s) => (s.meta ? { meta: { ...s.meta, status } } : {})),
  setProfile: (profile) => set({ profile }),
  setUploading: (v) => set({ isUploading: v }),
  clear: () => set({ meta: null, profile: null, isUploading: false }),
}));
