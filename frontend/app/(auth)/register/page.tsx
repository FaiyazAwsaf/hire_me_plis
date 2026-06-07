"use client";

import Link from "next/link";
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

export default function RegisterPage() {
  return (
    <main className="w-full min-h-screen bg-gradient-to-r from-[#D7E3D9] via-[#FDF5EF] to-[#F2DFD3] text-[#1A1A1A] antialiased selection:bg-neutral-200 overflow-x-hidden flex items-center justify-center p-6 relative">
      
      {/* Decorative Branding Watermark Header */}
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
              className="rounded-none border border-neutral-300 bg-neutral-50/50 px-3 py-2 text-xs font-sans focus-visible:ring-1 focus-visible:ring-black placeholder:text-neutral-400"
            />
          </div>

          <Button 
            className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors tracking-widest font-mono text-[10px] uppercase py-5 mt-2 flex items-center justify-center gap-2" 
            type="button"
          >
            <span>Create Account</span>
            <span className="text-neutral-400 font-sans text-xs translate-y-[-0.5px]">&rarr;</span>
          </Button>
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