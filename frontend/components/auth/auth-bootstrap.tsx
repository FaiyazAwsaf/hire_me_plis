"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// Runs once on mount: validates the stored JWT via GET /auth/me and hydrates
// the user object (which is not persisted by the store — only token is).
// If the token is missing or expired, clears state and redirects to /login.
export function AuthBootstrap() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    // Read token directly from store state to avoid stale closure in deps array
    const token = useAuthStore.getState().token;

    if (!token) {
      router.replace("/login");
      return;
    }

    api
      .get<{ id: string; email: string; created_at: string }>("/auth/me")
      .then((res) => {
        setAuth(token, res.data);
      })
      .catch(() => {
        clearAuth();
        router.replace("/login");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
