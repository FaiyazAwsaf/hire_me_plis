"use client";

import React, { useState } from "react";
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
  User 
} from "lucide-react";

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
    <div className="w-full h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10 select-none">
      
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

      {/* MAIN CONTAINER MATCHING DASHBOARD EXACTLY */}
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
                onClick={() => alert("Creating a clean WebSocket session instance...")}
                className="flex-1 justify-start gap-2 rounded-none border border-black bg-white text-xs font-black uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-colors"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
                <span>New Audit</span>
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

            {/* List of Previous Sessions */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              <div className="px-2 py-1 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                Recent Audits
              </div>
              {MOCK_CHAT_SESSIONS.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-none text-left text-xs uppercase tracking-tight font-bold transition-all border",
                    activeSessionId === session.id
                      ? "bg-black text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
                      : "bg-white text-neutral-800 border-neutral-300 hover:border-black"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{session.title}</span>
                </button>
              ))}
            </div>

            {/* User Profile Context segment */}
            <div className="flex items-center gap-2 border-t-2 border-black bg-neutral-100 p-3 text-[10px] uppercase font-black tracking-wider text-neutral-600">
              <div className="h-5 w-5 rounded-none border border-black bg-white flex items-center justify-center shrink-0">
                <User className="h-3 w-3 text-black stroke-[2.5px]" />
              </div>
              <span className="truncate"></span>
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

          {/* Dynamic Workspace Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b-2 border-black bg-neutral-50 px-6">
            <div className={cn("flex items-center gap-2", !isSidebarOpen && "pl-12")}>
              <Sparkles className="h-4 w-4 text-black shrink-0" />
              <h1 className="font-mono text-xs font-black uppercase tracking-widest">AI Chat</h1>
            </div>
          </div>

          {/* Message Interface Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 w-full max-w-none bg-[#fafafa]">
            <SystemMessage text="Hi! I'm your career co-pilot. I have analyzed your parsed resume. Ask me anything about your job alignments, dynamic custom roadmaps, or interview gaps." />
            
            <UserMessage text="Am I ready for a junior Machine Learning engineer role in Dhaka based on my skills?" />
            
            <SystemMessage text="Based on your embedded vector data, your profile lists Python and TensorFlow, giving you a 75% baseline fit score. However, the benchmark profile for this market often requests Docker and deployment knowledge, which is missing from your Projects chunk. Would you like me to map a short path to patch this?" />
          </div>

          {/* Persistent Input Bar Box */}
          <div className="shrink-0 border-t-2 border-black bg-white p-4">
            <div className="w-full flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask something... e.g., What skills am I missing for a Google position?"
                className="flex-1 border-2 border-black rounded-none h-12 bg-white px-4 font-sans text-sm text-black focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-400"
                onKeyDown={(e) => e.key === 'Enter' && alert("Hooking message vector upstream via WebSocket proxy...")}
              />
              <Button 
                type="button" 
                className="h-12 rounded-none border-2 border-black bg-black px-6 font-mono text-xs font-black uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0"
                onClick={() => alert("Dispatching message payload...")}
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5 stroke-[2.5px]" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* --- BRUTALIST SYSTEM ASSISTANT MESSAGE COMPONENT --- */
function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-3 items-start max-w-4xl text-left animate-in fade-in duration-150">
      <div className="h-8 w-8 rounded-none bg-black text-white flex items-center justify-center text-[10px] font-mono font-black uppercase shrink-0 border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        AI
      </div>
      <div className="rounded-none border border-black bg-white p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] flex-1">
        <p className="font-sans text-sm leading-relaxed text-neutral-900">{text}</p>
      </div>
    </div>
  );
}

/* --- BRUTALIST USER MESSAGE COMPONENT --- */
function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-3 items-start max-w-4xl ml-auto justify-end text-left animate-in fade-in duration-150">
      <div className="rounded-none border border-black bg-neutral-100 p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] flex-1">
        <p className="font-sans text-sm leading-relaxed text-neutral-900">{text}</p>
      </div>
      <div className="h-8 w-8 rounded-none bg-white text-black flex items-center justify-center text-[10px] font-mono font-black uppercase shrink-0 border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        User
      </div>
    </div>
  );
}