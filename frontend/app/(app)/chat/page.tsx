"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Menu,
  ChevronLeft,
  Plus,
  MessageSquare,
  Send,
  Sparkles,
  User,
  Trash2,
} from "lucide-react";
import { createChatSocket, type ChatWebSocket } from "@/lib/websocket";
import api from "@/lib/api";
import { useChatStore } from "@/store/chat";

export default function ChatPage() {
  const { messages, sessionId, isStreaming, addMessage, appendToken, finalizeAssistant, setStreaming, setSessionId, clear } =
    useChatStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; label: string }[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const socketRef = useRef<ChatWebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function fetchSessions() {
    api
      .get<{ sessions: { session_id: string; label: string }[] }>("/chat/sessions")
      .then((r) => setSessions(r.data.sessions.map((s) => ({ id: s.session_id, label: s.label }))))
      .catch(() => {});
  }

  // Seed sessionId on the client only — avoids SSR/client UUID mismatch
  useEffect(() => {
    if (sessionId) return; // already set (e.g. store was kept alive across navigations)
    const stored = localStorage.getItem("chat_session_id");
    const id = stored ?? crypto.randomUUID();
    if (!stored) localStorage.setItem("chat_session_id", id);
    setSessionId(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch session list whenever we have a valid sessionId
  useEffect(() => {
    if (!sessionId) return;
    fetchSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Load history and open WebSocket — waits until sessionId is initialised client-side
  useEffect(() => {
    if (!sessionId) return; // skip the empty-string SSR tick; re-runs when sessionId is set
    api
      .get<{ messages: { role: "user" | "assistant"; content: string; created_at: string }[] }>(
        `/chat/history?session_id=${sessionId}&limit=20`
      )
      .then((r) => {
        r.data.messages.forEach((m) =>
          addMessage({ role: m.role, content: m.content, created_at: m.created_at })
        );
      })
      .catch(() => {});

    const socket = createChatSocket(
      (msg) => {
        if (msg.type === "token") appendToken(msg.content);
        if (msg.type === "done") { finalizeAssistant(); fetchSessions(); }
        if (msg.type === "error") {
          setError(msg.content);
          finalizeAssistant();
        }
      },
      () => { setReady(true); setError(null); },
      (_e, reason) => {
        if (reason === "no_token" || reason === "auth_failed") {
          setError("Session expired. Please log out and log back in.");
        } else {
          setError("Connection failed. Make sure the backend is running on port 8000.");
        }
        setReady(false);
      },
      () => setReady(false)
    );

    socketRef.current = socket;
    return () => socket.close();
  // sessionId is stable after first set; effect re-runs once to open the real socket
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = inputMessage.trim();
    if (!text || isStreaming || !socketRef.current) return;
    setError(null);
    addMessage({ role: "user", content: text });
    setStreaming(true);
    socketRef.current.send(text, sessionId);
    setInputMessage("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function createNewSession() {
    socketRef.current?.close();
    socketRef.current = null;
    clear();
    setReady(false);
    setError(null);
    const newId = crypto.randomUUID();
    localStorage.setItem("chat_session_id", newId);
    setSessionId(newId);
    // Session list will refresh via the sessionId useEffect above
  }

  function switchSession(id: string) {
    if (id === sessionId) return;
    socketRef.current?.close();
    socketRef.current = null;
    clear();
    setReady(false);
    setError(null);
    localStorage.setItem("chat_session_id", id);
    setSessionId(id);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await api.delete(`/chat/sessions/${id}`);
    if (id === sessionId) createNewSession();
    fetchSessions();
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-linear-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10">

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

      {/* MAIN CONTAINER */}
      <div className="relative z-10 mx-auto w-full h-full flex rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden">

        {/* --- LEFT SIDEBAR: CHAT HISTORY --- */}
        <div
          className={cn(
            "h-full border-r-2 border-black bg-neutral-50 flex flex-col transition-all duration-200 ease-in-out shrink-0 overflow-hidden",
            isSidebarOpen ? "w-64" : "w-0 border-r-0"
          )}
        >
          <div className="flex flex-col h-full w-64 font-mono">
            {/* New Chat Action Row */}
            <div className="flex items-center justify-between gap-2 border-b-2 border-black p-3 bg-white">
              <Button
                onClick={createNewSession}
                className="flex-1 justify-start gap-2 rounded-none border border-black bg-white text-xs font-black uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-colors"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
                <span>New Chat</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none border border-transparent hover:border-black hover:bg-white text-black"
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse history pane"
              >
                <ChevronLeft className="h-4 w-4 stroke-[2.5px]" />
              </Button>
            </div>

            {/* Session History */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                Sessions
              </div>
              {sessions.length === 0 && (
                <p className="px-2 py-2 text-[10px] text-neutral-400 font-mono">No previous sessions</p>
              )}
              {sessions.map((s) => {
                const isActive = s.id === sessionId;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-none border transition-colors",
                      isActive
                        ? "bg-primary border-primary shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
                        : "bg-white border-transparent hover:border-black hover:bg-neutral-100"
                    )}
                  >
                    <button
                      onClick={() => switchSession(s.id)}
                      className={cn(
                        "flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 text-xs tracking-tight font-bold text-left",
                        isActive ? "text-primary-foreground" : "text-neutral-700"
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{s.label}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingDeleteId(s.id); }}
                      title="Delete session"
                      className={cn(
                        "shrink-0 p-1.5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-none hover:bg-red-100 hover:text-red-600",
                        isActive ? "text-primary-foreground hover:bg-red-700 hover:text-white" : "text-neutral-400"
                      )}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* User Profile Context */}
            <div className="flex items-center gap-2 border-t-2 border-black bg-neutral-100 p-3 text-[10px] uppercase font-black tracking-wider text-neutral-600">
              <div className="h-5 w-5 rounded-none border border-black bg-white flex items-center justify-center shrink-0">
                <User className="h-3 w-3 text-black stroke-[2.5px]" />
              </div>
              <span className="truncate">Connected</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: ACTIVE CONVERSATION DISPLAY --- */}
        <div className="relative flex h-full flex-1 flex-col bg-white overflow-hidden">

          {/* Floating Open Toggle Button */}
          {!isSidebarOpen && (
            <div className="absolute top-3 left-3 z-20">
              <Button
                size="icon"
                className="rounded-none border-2 border-black bg-white text-black hover:bg-neutral-100 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                onClick={() => setIsSidebarOpen(true)}
                title="Expand history pane"
              >
                <Menu className="h-4 w-4 stroke-[2.5px]" />
              </Button>
            </div>
          )}

          {/* Workspace Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b-2 border-black bg-neutral-50 px-6">
            <div className={cn("flex items-center gap-2", !isSidebarOpen && "pl-12")}>
              <Sparkles className="h-4 w-4 text-black shrink-0" />
              <h1 className="font-mono text-xs font-black uppercase tracking-widest">AI Assistant</h1>
            </div>
            <div className={cn("text-[10px] text-neutral-500 font-mono", ready ? "text-green-600" : "text-orange-600")}>
              {ready ? "Connected" : "Connecting…"}
            </div>
          </div>

          {/* Message Interface Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 w-full max-w-none bg-[#fafafa]">
            {messages.length === 0 && (
              <div className="text-center text-neutral-500 py-12">
                <p className="text-sm font-mono">No messages yet. Start a conversation!</p>
                <p className="text-xs mt-2">Try: "Am I ready for a senior backend role?"</p>
              </div>
            )}

            {messages.map((msg) => (
              msg.role === "assistant" ? (
                <SystemMessage key={msg.id} text={msg.content} isStreaming={isStreaming && msg === messages[messages.length - 1]} />
              ) : (
                <UserMessage key={msg.id} text={msg.content} />
              )
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Error display */}
          {error && (
            <div className="border-t border-red-200 bg-red-50 p-3 text-xs text-red-700 font-mono">
              {error}
            </div>
          )}

          {/* Persistent Input Bar */}
          <div className="shrink-0 border-t-2 border-black bg-white p-4">
            <div className="w-full flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={ready ? "Ask something..." : "Connecting…"}
                disabled={!ready || isStreaming}
                className="flex-1 border-2 border-black rounded-none h-12 bg-white px-4 font-sans text-sm text-black focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-400 disabled:opacity-50"
              />
              <Button
                type="button"
                disabled={!ready || isStreaming || !inputMessage.trim()}
                onClick={sendMessage}
                className="h-12 rounded-none border-2 border-primary bg-primary px-6 font-mono text-xs font-black uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0 disabled:opacity-50"
              >
                <span>{isStreaming ? "…" : "Send"}</span>
                {!isStreaming && <Send className="h-3.5 w-3.5 stroke-[2.5px]" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPendingDeleteId(null)}
          />
          {/* Dialog box */}
          <div className="relative z-10 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] p-6 w-80 font-mono">
            <h2 className="text-sm font-black uppercase tracking-widest mb-2">Delete Session?</h2>
            <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
              All messages in this session will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-none border border-black text-xs font-black uppercase hover:bg-neutral-100"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="rounded-none border-2 border-red-600 bg-red-600 text-white text-xs font-black uppercase hover:bg-red-700 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SystemMessage({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  return (
    <div className="flex gap-3 items-start max-w-4xl text-left animate-in fade-in duration-150">
      <div className="h-8 w-8 rounded-none bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-mono font-black uppercase shrink-0 border border-primary shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        AI
      </div>
      <div className="rounded-none border border-black bg-white p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] flex-1 min-w-0">
        <div className="prose prose-sm prose-neutral max-w-none font-sans text-neutral-900
          [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
          prose-headings:font-black prose-headings:text-black prose-headings:tracking-tight
          prose-h2:text-base prose-h3:text-sm
          prose-p:leading-relaxed prose-p:my-1.5
          prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5
          prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:rounded-none prose-pre:border-2 prose-pre:border-black
          prose-strong:font-black prose-strong:text-black
          prose-hr:border-black">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          {isStreaming && <span className="inline-block w-1 h-4 ml-0.5 bg-neutral-900 animate-pulse align-middle" />}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-3 items-start max-w-4xl ml-auto justify-end text-left animate-in fade-in duration-150">
      <div className="rounded-none border border-black bg-neutral-100 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] flex-1">
        <p className="font-sans text-sm leading-relaxed text-neutral-900">{text}</p>
      </div>
      <div className="h-8 w-8 rounded-none bg-white text-black flex items-center justify-center text-[10px] font-mono font-black uppercase shrink-0 border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        You
      </div>
    </div>
  );
}
