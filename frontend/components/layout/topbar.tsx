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
  LogOut 
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
    <header className="flex items-center justify-end gap-3 h-14 px-5 border-b bg-background shrink-0 relative">
      
      {/* --- NOTIFICATION DROPDOWN ANCHOR CONTAINER --- */}
      <div className="relative" ref={dropdownRef}>
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Notifications"
          onClick={() => {
            setIsNotificationsOpen(!isNotificationsOpen);
            setIsProfileOpen(false);
          }}
          className={`relative rounded-xl transition-colors ${isNotificationsOpen ? 'bg-muted' : ''}`}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center p-0.5 text-[10px] bg-red-500 hover:bg-red-500 text-white font-bold border-2 border-background animate-pulse">
              {unreadCount}
            </Badge>
          )}
        </Button>

        {/* --- DYNAMIC FLOATING AI NUDGES DISPLAY --- */}
        {isNotificationsOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-[380px] bg-popover text-popover-foreground border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
            {/* Header section */}
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-500 fill-red-500/20" />
                <h3 className="font-semibold text-sm">Agent Nudges & Reminders</h3>
              </div>
            </div>

            {/* Notification content body (Scroll-locked container after 3 elements) */}
            <div className="max-h-[315px] overflow-y-auto divide-y divide-border scrollbar-thin">
              {nudges.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Bell className="h-8 w-8 opacity-20" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground/80">Your AI co-pilot has no active warnings.</p>
                </div>
              ) : (
                nudges.map((nudge) => (
                  <div 
                    key={nudge.id}
                    className="p-4 hover:bg-muted/30 transition-colors flex gap-3 relative group"
                  >
                    <div className="mt-0.5 shrink-0">
                      {nudge.type === "warning" ? (
                        <div className="h-7 w-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                          <Briefcase className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
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
          <Avatar className="h-8 w-8 cursor-pointer ring-offset-background hover:ring-2 hover:ring-neutral-200 transition-all">
            <AvatarFallback className="text-xs font-semibold bg-neutral-900 text-white">
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

            <div className="p-1.5 border-t bg-neutral-50/50">
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