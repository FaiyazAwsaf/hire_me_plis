"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: { id: string; email: string; created_at: string };
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<RegisterResponse>("/auth/register", { email, password });
      setAuth(res.data.access_token, res.data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const raw =
        (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const message =
        typeof raw === "string"
          ? raw
          : Array.isArray(raw)
          ? (raw as Array<{ msg?: string }>).map((e) => e.msg ?? "Validation error").join("; ")
          : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-full min-h-screen bg-gradient-to-r from-[#D7E3D9] via-[#FDF5EF] to-[#F2DFD3] text-[#1A1A1A] antialiased selection:bg-neutral-200 overflow-x-hidden flex items-center justify-center p-6 relative">
      <div className="absolute top-0 left-0 w-full max-w-7xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between border-b border-neutral-400/30">
        <Link href="/" className="flex items-center select-none">
          <span className="font-serif text-[15px] tracking-wide text-neutral-900 flex items-center gap-[1px]">
            <span className="font-black tracking-tight uppercase text-black">HIRE ME</span>
            <span className="inline-block w-[4px] h-[4px] rounded-full bg-black mx-[4px] translate-y-[2px]" />
            <span className="font-medium italic text-neutral-600 lowercase">plis</span>
          </span>
        </Link>
      </div>

      <Card className="w-full max-w-sm rounded-none border border-neutral-300 bg-white shadow-md z-10 p-2">
        <CardHeader className="text-left border-b border-neutral-200 pb-6 mb-6">
          <CardTitle className="font-serif text-3xl font-black text-neutral-900 tracking-tight">
            Create account
          </CardTitle>
          <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mt-2 block">
            Start your AI career journey today
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 text-left">
              <Label
                htmlFor="email"
                className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block font-semibold"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-none border border-neutral-300 bg-neutral-50/50 px-3 py-2 text-xs font-sans focus-visible:ring-1 focus-visible:ring-black placeholder:text-neutral-400"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label
                htmlFor="password"
                className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block font-semibold"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-none border border-neutral-300 bg-neutral-50/50 px-3 py-2 text-xs font-sans focus-visible:ring-1 focus-visible:ring-black placeholder:text-neutral-400"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label
                htmlFor="confirm"
                className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block font-semibold"
              >
                Confirm Password
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="rounded-none border border-neutral-300 bg-neutral-50/50 px-3 py-2 text-xs font-sans focus-visible:ring-1 focus-visible:ring-black placeholder:text-neutral-400"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            <Button
              className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors tracking-widest font-mono text-[10px] uppercase py-5 mt-2 flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? "Creating account…" : "Create Account"}</span>
              {!loading && <span className="text-neutral-400 font-sans text-xs translate-y-[-0.5px]">&rarr;</span>}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-start text-left text-xs font-sans text-neutral-500 pt-4 mt-4 border-t border-dashed border-neutral-200">
          <span>Already have an account?&nbsp;</span>
          <Link href="/login" className="text-black font-semibold underline underline-offset-4 hover:text-neutral-700 transition-colors">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
