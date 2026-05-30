"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="flex items-center justify-end gap-3 h-14 px-5 border-b bg-background shrink-0">
      {/* Nudge bell — badge count wired up in Pillar 4 */}
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] hidden">
          0
        </Badge>
      </Button>

      {/* Avatar + sign out */}
      <button
        onClick={clearAuth}
        title="Sign out"
        className="focus-visible:outline-none rounded-full"
      >
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </button>
    </header>
  );
}
