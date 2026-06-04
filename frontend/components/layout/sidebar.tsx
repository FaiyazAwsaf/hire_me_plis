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
  Menu,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs",      label: "Job Hunter", icon: Briefcase },
  { href: "/chat",      label: "AI Assistant", icon: MessageSquare },
  { href: "/tracker",   label: "Tracker",     icon: KanbanSquare },
  { 
    href: "/cv",        
    label: "Resume Intelligence",  
    icon: FileText,
    children: [
      { href: "/cv/upload", label: "Resume Uploader" },
      { href: "/cv/builder", label: "Resume Builder" },
    ]
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(["/cv"]); // Resume Intelligence expanded by default

  // Checks if a route matches or is a dynamic child of the nav item
  const isRouteActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  return (
    <aside 
      className={cn(
        "m-3 mr-0 flex h-[calc(100%-1.5rem)] shrink-0 flex-col rounded-2xl border border-white/65 bg-white/55 text-sidebar-foreground shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition-all duration-300 ease-in-out text-left",
        isExpanded ? "w-60" : "w-16"
      )}
    >
      {/* --- LOGO / TOGGLE AREA --- */}
      <div className="flex items-center h-14 px-4 border-b border-white/60 justify-between gap-2 overflow-hidden">
        {isExpanded ? (
          <>
            <span className="font-black text-base tracking-tight truncate text-neutral-900 animate-in fade-in duration-200">
              Hire Me Plis<span className="text-red-500 font-extrabold"></span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl border border-white/60 bg-white/45 text-neutral-500 shadow-sm backdrop-blur hover:bg-white/75"
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
            className="h-9 w-9 rounded-xl border border-white/60 bg-white/45 text-neutral-700 shadow-sm backdrop-blur hover:bg-white/75 mx-auto shrink-0"
            onClick={() => setIsExpanded(true)}
            title="Expand sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* --- NAVIGATION LINKS --- */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isRouteActive(item.href);
          const Icon = item.icon;
          const hasChildren = "children" in item && item.children;
          const isItemExpanded = expandedItems.includes(item.href);
          
          return (
            <div key={item.href}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                    active
                      ? "border border-white/70 bg-white/75 text-neutral-950 shadow-[0_12px_30px_rgba(15,23,42,0.10)] font-semibold"
                      : "text-neutral-600 hover:bg-white/55 hover:text-neutral-950 hover:shadow-sm"
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200", 
                      !active && "group-hover:scale-105"
                    )} 
                  />
                  
                  {isExpanded && (
                    <>
                      <span className="truncate animate-in fade-in slide-in-from-left-2 duration-200">
                        {item.label}
                      </span>
                      <ChevronDown 
                        className={cn(
                          "h-4 w-4 shrink-0 ml-auto transition-transform duration-200",
                          isItemExpanded && "rotate-180"
                        )}
                      />
                    </>
                  )}

                  {!isExpanded && (
                    <div className={cn(
                      "absolute left-0 w-1 h-4 bg-sky-500 rounded-r-md transition-opacity opacity-0 scale-0 origin-left",
                      active ? "opacity-100 scale-100" : "group-hover:opacity-60 group-hover:scale-100"
                    )} />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  title={!isExpanded ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                    active
                      ? "border border-white/70 bg-white/75 text-neutral-950 shadow-[0_12px_30px_rgba(15,23,42,0.10)] font-semibold"
                      : "text-neutral-600 hover:bg-white/55 hover:text-neutral-950 hover:shadow-sm"
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200", 
                      !active && "group-hover:scale-105"
                    )} 
                  />
                  
                  {isExpanded && (
                    <span className="truncate animate-in fade-in slide-in-from-left-2 duration-200">
                      {item.label}
                    </span>
                  )}

                  {!isExpanded && (
                    <div className={cn(
                      "absolute left-0 w-1 h-4 bg-sky-500 rounded-r-md transition-opacity opacity-0 scale-0 origin-left",
                      active ? "opacity-100 scale-100" : "group-hover:opacity-60 group-hover:scale-100"
                    )} />
                  )}
                </Link>
              )}

              {/* Render children if expanded and has children */}
              {hasChildren && isItemExpanded && isExpanded && (
                <div className="pl-6 space-y-1 mt-1">
                  {item.children.map((child) => {
                    const childActive = isRouteActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
                          childActive
                            ? "border border-white/60 bg-white/65 text-neutral-950 font-semibold shadow-sm"
                            : "text-neutral-600 hover:text-neutral-950 hover:bg-white/50"
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
