import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

interface ChatState {
  messages: ChatMessage[];
  sessionId: string;
  isStreaming: boolean;
  addMessage: (msg: Omit<ChatMessage, "id">) => void;
  // Appends a streaming token to the last assistant message, creating it if needed
  appendToken: (token: string) => void;
  finalizeAssistant: () => void;
  setStreaming: (v: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  sessionId: uid(),
  isStreaming: false,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, { ...msg, id: uid() }] })),

  appendToken: (token) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: last.content + token };
      } else {
        msgs.push({ id: uid(), role: "assistant", content: token });
      }
      return { messages: msgs };
    }),

  finalizeAssistant: () => set({ isStreaming: false }),
  setStreaming: (v) => set({ isStreaming: v }),
  clear: () => set({ messages: [], sessionId: uid(), isStreaming: false }),
}));
