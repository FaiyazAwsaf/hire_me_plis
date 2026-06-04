"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Sparkles,
  Briefcase,
  CheckSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";

interface Nudge {
  id: string;
  type: "warning" | "goal" | "system";
  text: string;
  actionView: "kanban" | "calendar" | "goals";
  actionLabel?: string;
  timestamp: string;
}

const MOCK_NUDGES: Nudge[] = [
  {
    id: "nudge-1",
    type: "warning",
    text: "You haven't applied this week. Here are 3 openings matching your profile.",
    actionView: "kanban",
    actionLabel: "View Match Cards",
    timestamp: "2h ago",
  },
  {
    id: "nudge-2",
    type: "goal",
    text: "Goal checklist tracking: Your deadline to 'Update CV by Sunday' is approaching.",
    actionView: "goals",
    actionLabel: "Go to Tracker",
    timestamp: "5h ago",
  },
  {
    id: "nudge-3",
    type: "goal",
    text: "Review your structured upcoming tasks on your personal calendar timeline grid.",
    actionView: "calendar",
    actionLabel: "View Calendar",
    timestamp: "6h ago",
  },
  {
    id: "nudge-4",
    type: "system",
    text: "System sync successful: All ongoing applications are synchronized with your active goals.",
    actionView: "kanban",
    actionLabel: "Open Dashboard",
    timestamp: "1d ago",
  }
];

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [nudges] = useState<Nudge[]>(MOCK_NUDGES);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "CP";
  const unreadCount = nudges.length;

  // Handle clicking outside to automatically close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const handleNudgeNavigation = (view: "kanban" | "calendar" | "goals") => {
    setIsNotificationsOpen(false);
    router.push(`/tracker?view=${view}`);
  };

  return (
    <header className="relative z-[9000] flex h-16 w-full shrink-0 items-center justify-end gap-3 overflow-visible border-b border-slate-700/35 bg-slate-900/72 px-6 shadow-[0_14px_42px_rgba(15,23,42,0.22)] backdrop-blur-2xl">
      
      {/* --- NOTIFICATION DROPDOWN ANCHOR CONTAINER --- */}
      <div className="relative z-[10000]" ref={dropdownRef}>
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Notifications"
          onClick={() => {
            setIsNotificationsOpen(!isNotificationsOpen);
            setIsProfileOpen(false);
          }}
          className={`relative rounded-full border border-white/15 bg-white/10 text-white shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/18 hover:shadow-md ${isNotificationsOpen ? 'bg-white/20 shadow-md' : ''}`}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center p-0.5 text-[10px] bg-red-500 hover:bg-red-500 text-white font-bold border-2 border-slate-900">
              {unreadCount}
            </Badge>
          )}
        </Button>

        {/* --- DYNAMIC FLOATING AI NUDGES DISPLAY --- */}
        {isNotificationsOpen && (
          <div className="absolute right-0 z-[100000] mt-2 w-80 overflow-hidden rounded-2xl border border-white bg-white text-popover-foreground shadow-[0_32px_110px_rgba(15,23,42,0.35)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-3 duration-200 sm:w-[380px]">
            {/* Header section */}
            <div className="p-4 border-b border-white/65 bg-white/45 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-500 fill-red-500/20" />
                <h3 className="font-semibold text-sm">Agent Nudges & Reminders</h3>
              </div>
            </div>

            {/* Notification content body (Scroll-locked container after 3 elements) */}
            <div className="max-h-[315px] overflow-y-auto divide-y divide-border scrollbar-thin">
              {nudges.length === 0 ? (
                <div className="m-4 rounded-2xl border border-white/70 bg-white/55 p-8 text-center text-muted-foreground shadow-inner flex flex-col items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/65 shadow-sm">
                    <Bell className="h-5 w-5 opacity-45" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-800">All caught up!</p>
                  <p className="text-xs text-muted-foreground/80">Your AI co-pilot has no active warnings.</p>
                </div>
              ) : (
                nudges.map((nudge) => (
                  <div 
                    key={nudge.id}
                    className="p-4 hover:bg-white/50 transition-colors flex gap-3 relative group"
                  >
                    <div className="mt-0.5 shrink-0">
                      {nudge.type === "warning" ? (
                        <div className="h-7 w-7 rounded-xl bg-orange-50/90 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm">
                          <Briefcase className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-xl bg-red-50/90 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
                          <CheckSquare className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs leading-relaxed text-foreground font-medium text-left">
                        {nudge.text}
                      </p>
                      
                      <div className="flex items-center gap-3">
                        {nudge.actionLabel && (
                          <button 
                            onClick={() => handleNudgeNavigation(nudge.actionView)}
                            className="text-[11px] text-red-500 font-semibold hover:underline"
                          >
                            {nudge.actionLabel} &rarr;
                          </button>
                        )}
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {nudge.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- USER MENU DROPDOWN CONTAINER --- */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => {
            setIsProfileOpen(!isProfileOpen);
            setIsNotificationsOpen(false);
          }}
          title="User settings"
          className="focus-visible:outline-none rounded-full block"
        >
          <Avatar className="h-9 w-9 cursor-pointer border border-white/15 bg-white/10 shadow-sm ring-offset-background backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/18 hover:shadow-md">
            <AvatarFallback className="text-xs font-semibold bg-white/12 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* --- DYNAMIC PROFILE MENU DROPDOWN --- */}
        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200 text-left">
            <div className="p-3 border-b bg-muted/10">
              <p className="text-xs text-muted-foreground font-medium">Signed in as</p>
              <p className="text-xs font-bold text-neutral-900 truncate mt-0.5">
                {user?.email ?? "pilot@career.ai"}
              </p>
            </div>

            <div className="p-1.5 space-y-0.5">
              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 hover:bg-muted transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-neutral-400" />
                <span>Account Settings</span>
              </Link>
            </div>

            {/* Action Section */}
            <div className="p-1.5 border-t border-white/60 bg-white/35">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </header>
  );
}
