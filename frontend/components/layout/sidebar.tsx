"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  KanbanSquare,
  FileText,
  ChevronLeft,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs",      label: "Job Hunter", icon: Briefcase },
  { href: "/chat",      label: "AI Assistant", icon: MessageSquare },
  { href: "/tracker",   label: "Tracker",     icon: KanbanSquare },
  { href: "/cv",        label: "CV Builder",  icon: FileText },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  // Checks if a route matches or is a dynamic child of the nav item
  const isRouteActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside 
      className={cn(
        "flex flex-col shrink-0 border-r bg-sidebar text-sidebar-foreground h-full transition-all duration-300 ease-in-out text-left",
        isExpanded ? "w-60" : "w-16"
      )}
    >
      {/* --- LOGO / TOGGLE AREA --- */}
      <div className="flex items-center h-14 px-4 border-b justify-between gap-2 overflow-hidden">
        {isExpanded ? (
          <>
            <span className="font-black text-base tracking-tight truncate text-neutral-900 animate-in fade-in duration-200">
              Hire Me Plis<span className="text-red-500 font-extrabold"></span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-500 hover:bg-neutral-100 rounded-lg shrink-0"
              onClick={() => setIsExpanded(false)}
              title="Minimize sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-neutral-700 hover:bg-neutral-100 rounded-lg mx-auto shrink-0"
            onClick={() => setIsExpanded(true)}
            title="Expand sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* --- NAVIGATION LINKS --- */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isRouteActive(href);
          
          return (
            <Link
              key={href}
              href={href}
              title={!isExpanded ? label : undefined} // Tooltip fallback when minimized
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                active
                  ? "bg-black text-white shadow-sm font-semibold"
                  : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900"
              )}
            >
              <Icon 
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200", 
                  !active && "group-hover:scale-105"
                )} 
              />
              
              {/* Conditional rendering with tracking safeguards */}
              {isExpanded && (
                <span className="truncate animate-in fade-in slide-in-from-left-2 duration-200">
                  {label}
                </span>
              )}

              {/* Minimalist Hover Indicator Dot for Minimized State */}
              {!isExpanded && (
                <div className={cn(
                  "absolute left-0 w-1 h-4 bg-red-500 rounded-r-md transition-opacity opacity-0 scale-0 origin-left",
                  active ? "opacity-100 scale-100" : "group-hover:opacity-60 group-hover:scale-100"
                )} />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}