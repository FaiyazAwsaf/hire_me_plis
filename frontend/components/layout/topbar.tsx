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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { useDashboardStore } from "@/store/dashboard";
import api from "@/lib/api";

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { nudges, unreadCount, setNudges, markNudgeRead } = useDashboardStore();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoadingNudges, setIsLoadingNudges] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  // Fetch nudges on mount and when opening the dropdown
  useEffect(() => {
    if (isNotificationsOpen) {
      setIsLoadingNudges(true);
      api
        .get<{ nudges: typeof nudges; unread_count: number }>("/nudges")
        .then((r) => setNudges(r.data.nudges, r.data.unread_count))
        .catch(console.error)
        .finally(() => setIsLoadingNudges(false));
    }
  }, [isNotificationsOpen, setNudges]);

  // Close dropdowns when clicking outside
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

  const handleMarkRead = async (nudgeId: string) => {
    markNudgeRead(nudgeId);
    await api.patch(`/nudges/${nudgeId}/read`).catch(console.error);
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const handleNudgeNavigation = (view: "kanban" | "calendar" | "goals") => {
    setIsNotificationsOpen(false);
    router.push(`/tracker?view=${view}`);
  };

  return (
    <header className="relative z-[9000] flex h-16 w-full shrink-0 items-center justify-between border-b-2 border-black bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] px-6 text-[#1A1A1A]">

      {/* LOGO */}
      <Link
        href="/"
        className="flex items-center group cursor-pointer select-none py-1 transition-all duration-300"
        title="Go to home"
      >
        <span className="font-serif text-[13px] tracking-wide text-slate-900 antialiased flex items-center gap-[1px]">
          <span className="font-serif font-black tracking-tight uppercase text-black">
            HIRE ME
          </span>
          <span className="inline-block w-[5px] h-[5px] rounded-full bg-rose-600 mx-[3px] transform translate-y-[3px] shrink-0" />
          <span className="font-serif font-medium italic text-neutral-700 tracking-wide">
            plis
          </span>
        </span>
      </Link>

      {/* RIGHT SIDE: NOTIFICATIONS + PROFILE */}
      <div className="flex items-center gap-4">

        {/* NOTIFICATION DROPDOWN */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
            className="relative rounded-none border-0 bg-transparent text-black p-0 h-auto w-auto hover:bg-transparent hover:text-neutral-600 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1.5 h-3.5 min-w-3.5 flex items-center justify-center p-0 text-[8px] bg-rose-600 text-white font-mono font-bold rounded-full border-0">
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* NUDGES DROPDOWN PANEL */}
          {isNotificationsOpen && (
            <div className="absolute right-0 z-[100000] mt-2 top-full w-80 overflow-hidden rounded-none border-2 border-black bg-white text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-in fade-in duration-100 sm:w-[380px]">
              <div className="p-3 border-b-2 border-black bg-neutral-50 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-serif font-black text-xs uppercase tracking-wider text-primary flex-1">
                  Agent Nudges & Reminders
                </h3>
                <span className="text-[11px] font-mono text-neutral-500">
                  {unreadCount} unread
                </span>
              </div>

              {/* NUDGES LIST */}
              <div className="max-h-[315px] overflow-y-auto divide-y divide-black scrollbar-thin">
                {isLoadingNudges ? (
                  <div className="p-4 text-xs text-neutral-500 text-center">Loading…</div>
                ) : nudges.length === 0 ? (
                  <div className="m-4 rounded-none border border-black bg-neutral-50 p-8 text-center flex flex-col items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-none border border-black bg-white shadow-sm">
                      <Bell className="h-5 w-5 opacity-45" />
                    </div>
                    <p className="text-xs font-semibold text-neutral-800">All caught up!</p>
                    <p className="text-[11px] text-neutral-600">Your AI co-pilot has no active nudges.</p>
                  </div>
                ) : (
                  nudges.map((nudge) => (
                    <div
                      key={nudge.id}
                      className="p-4 hover:bg-neutral-50 transition-colors flex gap-3 relative group"
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className="h-7 w-7 rounded-none bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm">
                          <Briefcase className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-1.5 min-w-0">
                        <p className="text-xs leading-relaxed text-foreground font-medium text-left">
                          {nudge.body}
                        </p>
                      </div>

                      <button
                        onClick={() => handleMarkRead(nudge.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 transition-all"
                        title="Mark as read"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE DROPDOWN */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
            title="User settings"
            className="focus-visible:outline-none rounded-full block"
          >
            <Avatar className="h-8 w-8 cursor-pointer border border-black bg-white shadow-sm">
              <AvatarFallback className="text-xs font-bold text-black">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* PROFILE MENU DROPDOWN */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-black border-2 border-black rounded-none shadow-[4px_4px_0px_rgba(0,0,0,1)] z-50 overflow-hidden animate-in fade-in duration-100">
              <div className="p-3 border-b-2 border-black bg-neutral-50">
                <p className="text-xs text-neutral-600 font-mono uppercase tracking-wider">Signed in as</p>
                <p className="text-xs font-bold text-neutral-900 truncate mt-0.5">
                  {user?.email ?? "user@example.com"}
                </p>
              </div>

              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-none text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Account Settings</span>
                </Link>
              </div>

              {/* LOGOUT */}
              <div className="p-1.5 border-t-2 border-black bg-neutral-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-none text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
