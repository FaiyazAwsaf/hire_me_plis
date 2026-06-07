"use client";

import React, { useState, useEffect } from "react";
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
    href: "/cv/upload",       
    label: "Resume",  
    icon: FileText,
    triggerKey: "/cv", 
    children: [
      { href: "/cv/upload", label: "Resume Uploader" },
      { href: "/cv/builder", label: "Resume Builder" },
    ]
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(["/cv"]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isRouteActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href) || (href === "/cv/upload" && pathname.startsWith("/cv"));
  };

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => 
      prev.includes(key) ? prev.filter(h => h !== key) : [...prev, key]
    );
  };

  return (
    <aside 
      className={cn(
        "flex h-full shrink-0 flex-col border-r-2 border-black bg-[#f7ede2] text-[#1A1A1A] transition-all duration-300 ease-in-out text-left",
        isExpanded ? "w-60" : "w-16"
      )}
    >
      {!isHydrated ? (
        <>
          <div className="h-14 px-4 gap-2" />
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto" />
        </>
      ) : (
        <>
          {/* --- TOGGLE AREA (BORDER LINE REMOVED) --- */}
          <div className={cn(
            "flex items-center h-14 px-4 gap-2 overflow-hidden",
            isExpanded ? "justify-end" : "justify-center"
          )}>
            {isExpanded ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none border border-black bg-white/40 text-[#1A1A1A] hover:bg-white"
                onClick={() => setIsExpanded(false)}
                title="Minimize sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none border border-black bg-white/40 text-[#1A1A1A] hover:bg-white mx-auto shrink-0"
                onClick={() => setIsExpanded(true)}
                title="Expand sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* --- NAVIGATION LINKS --- */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(item.href);
              const Icon = item.icon;
              const hasChildren = "children" in item && item.children;
              const targetKey = "triggerKey" in item ? item.triggerKey : item.href;
              const isItemExpanded = expandedItems.includes(targetKey);
              
              return (
                <div key={item.href}>
                  {hasChildren ? (
                    <div className="relative group flex items-center w-full">
                      <Link
                        href={item.href}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-none px-3 py-2.5 text-sm font-bold transition-all duration-150 relative pr-10",
                          active
                            ? "border-2 border-primary bg-primary/10 text-primary shadow-[2px_2px_0px_rgba(0,0,0,0.15)]"
                            : "text-neutral-700 hover:bg-white/50 hover:text-black"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        
                        {isExpanded && (
                          <span className="truncate font-sans font-bold">
                            {item.label}
                          </span>
                        )}

                        {!isExpanded && active && (
                          <div className="absolute left-0 w-1 h-4 bg-primary rounded-r-none" />
                        )}
                      </Link>

                      {hasChildren && isExpanded && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleExpanded(targetKey);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-black transition-colors"
                          aria-label="Toggle submenu"
                        >
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isItemExpanded && "rotate-180"
                            )}
                          />
                        </button>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      title={!isExpanded ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-none px-3 py-2.5 text-sm font-bold transition-all duration-150 group relative",
                        active
                          ? "border-2 border-primary bg-primary/10 text-primary shadow-[2px_2px_0px_rgba(0,0,0,0.15)]"
                          : "text-neutral-700 hover:bg-white/50 hover:text-black"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      
                      {isExpanded && (
                        <span className="truncate font-sans font-bold">
                          {item.label}
                        </span>
                      )}

                      {!isExpanded && active && (
                        <div className="absolute left-0 w-1 h-4 bg-primary rounded-r-none" />
                      )}
                    </Link>
                  )}

                  {/* Children links layer */}
                  {hasChildren && isItemExpanded && isExpanded && (
                    <div className="pl-6 space-y-1 mt-1 border-l border-neutral-400 ml-5">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2 rounded-none px-3 py-1.5 text-xs font-bold transition-all duration-150",
                              childActive
                                ? "text-black underline decoration-2 underline-offset-4"
                                : "text-neutral-600 hover:text-black"
                            )}
                          >
                            <span className="w-1 h-1 bg-current shrink-0" />
                            <span className="font-sans">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}