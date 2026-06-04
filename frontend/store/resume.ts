import { create } from "zustand";
import { Resume, ResumeTemplateId, defaultResume } from "@/lib/resume/types";

interface ResumeStore {
  // Current resume being edited
  currentResume: Resume;
  setCurrentResume: (resume: Resume) => void;
  updateCurrentResume: (updates: Partial<Resume>) => void;

  // List of saved resumes
  savedResumes: Resume[];
  setSavedResumes: (resumes: Resume[]) => void;
  addSavedResume: (resume: Resume) => void;
  removeSavedResume: (id: string) => void;
  updateSavedResume: (id: string, updates: Partial<Resume>) => void;

  // UI state
  selectedTemplate: ResumeTemplateId;
  setSelectedTemplate: (template: ResumeTemplateId) => void;

  // Reset
  reset: () => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  currentResume: { ...defaultResume, id: `resume_${Date.now()}` },
  setCurrentResume: (resume) => set({ currentResume: resume }),
  updateCurrentResume: (updates) =>
    set((state) => ({
      currentResume: {
        ...state.currentResume,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    })),

  savedResumes: [],
  setSavedResumes: (resumes) => set({ savedResumes: resumes }),
  addSavedResume: (resume) =>
    set((state) => ({
      savedResumes: [...state.savedResumes, resume],
    })),
  removeSavedResume: (id) =>
    set((state) => ({
      savedResumes: state.savedResumes.filter((r) => r.id !== id),
    })),
  updateSavedResume: (id, updates) =>
    set((state) => ({
      savedResumes: state.savedResumes.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    })),

  selectedTemplate: "modern",
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  reset: () => set({ currentResume: { ...defaultResume, id: `resume_${Date.now()}` } }),
}));
