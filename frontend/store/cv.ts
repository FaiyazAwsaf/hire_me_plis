import { create } from "zustand";

export type CvStatus = "pending" | "processing" | "embedding" | "done" | "error";

interface CvMeta {
  cvId: string;
  filename: string;
  uploadedAt: string;
  status: CvStatus;
}

interface CvState {
  meta: CvMeta | null;
  isUploading: boolean;
  setMeta: (meta: CvMeta) => void;
  setStatus: (status: CvStatus) => void;
  setUploading: (v: boolean) => void;
  clear: () => void;
}

export const useCvStore = create<CvState>()((set) => ({
  meta: null,
  isUploading: false,
  setMeta: (meta) => set({ meta }),
  setStatus: (status) =>
    set((s) => (s.meta ? { meta: { ...s.meta, status } } : {})),
  setUploading: (v) => set({ isUploading: v }),
  clear: () => set({ meta: null, isUploading: false }),
}));
