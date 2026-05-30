import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth(token, user) {
        localStorage.setItem("access_token", token);
        // Cookie lets the server-side proxy.ts check auth without JS
        document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        set({ token, user });
      },
      clearAuth() {
        localStorage.removeItem("access_token");
        document.cookie = "access_token=; path=/; max-age=0";
        set({ token: null, user: null });
      },
    }),
    {
      name: "auth",
      // Only persist the token; user is re-fetched on load via GET /auth/me
      partialize: (state) => ({ token: state.token }),
    }
  )
);
