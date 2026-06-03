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
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-background overflow-hidden border rounded-xl shadow-sm">
      
      {/* --- LEFT SIDEBAR: CHAT HISTORY --- */}
      <div 
        className={`h-full bg-muted/30 border-r flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarOpen ? "w-64" : "w-0 border-r-0"
        }`}
      >
        {isSidebarOpen && (
          <div className="flex flex-col h-full w-64 animate-in fade-in duration-200">
            {/* New Chat Action */}
            <div className="p-3 border-b flex items-center justify-between gap-2">
              <Button 
                variant="outline" 
                className="flex-1 justify-start gap-2 text-sm font-medium"
                onClick={() => alert("Creating a clean WebSocket session instance...")}
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* List of Previous Sessions */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Audits
              </div>
              {MOCK_CHAT_SESSIONS.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    activeSessionId === session.id
                      ? "bg-secondary text-secondary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate flex-1">{session.title}</span>
                </button>
              ))}
            </div>

            {/* User Profile Context segment */}
            <div className="p-3 border-t bg-muted/40 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-5 w-5 rounded-full bg-zinc-200 flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
              <span className="truncate font-medium">CV Reference Indexed</span>
            </div>
          </div>
        )}
      </div>

      {/* --- RIGHT SIDE: ACTIVE CONVERSATION DISPLAY --- */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        
        {/* Floating Open Toggle Button (Visible only when history is tucked away) */}
        {!isSidebarOpen && (
          <div className="absolute top-3 left-3 z-20">
            <Button 
              variant="outline" 
              size="icon" 
              className="shadow-sm"
              onClick={() => setIsSidebarOpen(true)}
              title="Expand history"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Dynamic Header */}
        <div className="h-14 border-b flex items-center px-6 bg-background/50 backdrop-blur justify-between shrink-0">
          <div className="flex items-center gap-2 pl-10 sm:pl-0">
            <Sparkles className="h-4 w-4 text-red-500" />
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
        <div className="p-4 border-t bg-background shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask something... e.g., What skills am I missing for a Google position?"
              className="flex-1 focus-visible:ring-red-400"
              onKeyDown={(e) => e.key === 'Enter' && alert("Hooking message vector upstream via WebSocket proxy...")}
            />
            <Button type="button" className="gap-2 px-4" onClick={() => alert("Dispatching message payload...")}>
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
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
      <div className="bg-muted/40 rounded-2xl px-4 py-3 border border-muted">
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
      </div>
    </div>
  );
}

/* --- USER UI MESSAGE COMPONENT --- */
function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-4 items-start max-w-2xl ml-auto justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-sm bg-zinc-900 text-white">
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
      <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-xs font-bold shrink-0 border text-zinc-600">
        ME
      </div>
    </div>
  );
}