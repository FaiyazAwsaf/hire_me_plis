"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Menu, 
  ChevronLeft, 
  Plus, 
  MessageSquare, 
  Send, 
  Sparkles, 
  User 
} from "lucide-react";

// Mock history data structured for your feature guidelines (Pillar 3)
const MOCK_CHAT_SESSIONS = [
  { id: "1", title: "CV Fit Score: ML Intern", date: "Today" },
  { id: "2", title: "3-Month DevOps Roadmap", date: "Today" },
  { id: "3", title: "Google Skill Gap Analysis", date: "Yesterday" },
  { id: "4", title: "Cover Letter: SaaS Startup", date: "3 days ago" },
];

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState("1");
  const [inputMessage, setInputMessage] = useState("");

  return (
    <div className="relative isolate h-[calc(100vh-theme(spacing.16))] w-full">
      <PageLightPillars />
      <div className="relative z-10 flex h-full w-full overflow-hidden rounded-[28px] border border-white/55 bg-white/38 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
      
      {/* --- LEFT SIDEBAR: CHAT HISTORY --- */}
      <div 
        className={`h-full border-r border-white/12 bg-slate-900/68 text-slate-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarOpen ? "w-64" : "w-0 border-r-0"
        }`}
      >
        {isSidebarOpen && (
          <div className="flex flex-col h-full w-64 animate-in fade-in duration-200">
            {/* New Chat Action */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 p-3">
              <Button 
                variant="outline" 
                className="flex-1 justify-start gap-2 border-white/12 bg-white/10 text-sm font-medium text-white hover:bg-white/18"
                onClick={() => alert("Creating a clean WebSocket session instance...")}
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-200 hover:bg-white/10 hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* List of Previous Sessions */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Recent Audits
              </div>
              {MOCK_CHAT_SESSIONS.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    activeSessionId === session.id
                      ? "bg-white/16 text-white font-medium"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate flex-1">{session.title}</span>
                </button>
              ))}
            </div>

            {/* User Profile Context segment */}
            <div className="flex items-center gap-2 border-t border-white/10 bg-white/8 p-3 text-xs text-slate-300">
              <div className="h-5 w-5 rounded-full bg-white/12 flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
              <span className="truncate font-medium">CV Reference Indexed</span>
            </div>
          </div>
        )}
      </div>

      {/* --- RIGHT SIDE: ACTIVE CONVERSATION DISPLAY --- */}
      <div className="relative flex h-full flex-1 flex-col bg-white/42 backdrop-blur-xl">
        
        {/* Floating Open Toggle Button (Visible only when history is tucked away) */}
        {!isSidebarOpen && (
          <div className="absolute top-3 left-3 z-20">
            <Button 
              variant="outline" 
              size="icon" 
              className="border-white/60 bg-white/70 shadow-sm backdrop-blur"
              onClick={() => setIsSidebarOpen(true)}
              title="Expand history"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Dynamic Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/60 bg-white/45 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 pl-10 sm:pl-0">
            <Sparkles className="h-4 w-4 text-[#4F46E5]" />
            <h1 className="font-semibold text-sm sm:text-base">AI Engine</h1>
          </div>
          
        </div>

        {/* Message Interface */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl w-full mx-auto">
          <SystemMessage text="Hi! I'm your career co-pilot. I have analyzed your parsed resume. Ask me anything about your job alignments, dynamic custom roadmaps, or interview gaps." />
          
          {/* Example User Response Visualization */}
          <UserMessage text="Am I ready for a junior Machine Learning engineer role in Dhaka based on my skills?" />
          
          <SystemMessage text="Based on your embedded vector data, your profile lists Python and TensorFlow, giving you a 75% baseline fit score. However, the benchmark profile for this market often requests Docker and deployment knowledge, which is missing from your Projects chunk. Would you like me to map a short path to patch this?" />
        </div>

        {/* Persistent Input Bar */}
        <div className="shrink-0 border-t border-white/60 bg-white/45 p-4 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask something... e.g., What skills am I missing for a Google position?"
              className="flex-1 border-white/60 bg-white/70 focus-visible:ring-[#818CF8]"
              onKeyDown={(e) => e.key === 'Enter' && alert("Hooking message vector upstream via WebSocket proxy...")}
            />
            <Button type="button" className="gap-2 bg-slate-900 px-4 text-white hover:bg-slate-800" onClick={() => alert("Dispatching message payload...")}>
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}

/* --- SYSTEM ASSISTANT UI MESSAGE COMPONENT --- */
function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-4 items-start max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm border border-neutral-800">
        Chat
      </div>
      <div className="rounded-2xl border border-white/60 bg-white/58 px-4 py-3 shadow-sm backdrop-blur-xl">
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
      </div>
    </div>
  );
}

/* --- USER UI MESSAGE COMPONENT --- */
function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-4 items-start max-w-2xl ml-auto justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm">
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
      <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-xs font-bold shrink-0 border text-zinc-600">
        ME
      </div>
    </div>
  );
}

function PageLightPillars() {
  return (
    <>
      <div className="pointer-events-none absolute inset-[-6rem] z-0 overflow-hidden rounded-[40px]" aria-hidden="true">
        <div className="page-light-pillar page-light-pillar-primary absolute left-[12%] top-[-18%] h-[720px] w-48 rounded-full bg-[linear-gradient(180deg,transparent_0%,rgba(79,70,229,0.10)_12%,rgba(129,140,248,0.30)_42%,rgba(196,181,253,0.18)_70%,transparent_100%)] blur-3xl" />
        <div className="page-light-pillar page-light-pillar-secondary absolute right-[15%] top-[-20%] h-[760px] w-56 rounded-full bg-[linear-gradient(180deg,transparent_0%,rgba(196,181,253,0.12)_16%,rgba(129,140,248,0.26)_46%,rgba(79,70,229,0.14)_74%,transparent_100%)] blur-3xl" />
      </div>
      <style jsx>{`
        .page-light-pillar {
          opacity: 0.82;
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
        .page-light-pillar-primary {
          animation: page-light-pillar-primary 34s ease-in-out infinite alternate;
        }
        .page-light-pillar-secondary {
          animation: page-light-pillar-secondary 38s ease-in-out infinite alternate;
        }
        @keyframes page-light-pillar-primary {
          from { transform: translate3d(0, 0, 0) scaleY(1); }
          to { transform: translate3d(22px, 26px, 0) scaleY(1.07); }
        }
        @keyframes page-light-pillar-secondary {
          from { transform: translate3d(0, 0, 0) scaleY(1); }
          to { transform: translate3d(-24px, 30px, 0) scaleY(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .page-light-pillar {
            animation: none;
            will-change: auto;
          }
        }
      `}</style>
    </>
  );
}
