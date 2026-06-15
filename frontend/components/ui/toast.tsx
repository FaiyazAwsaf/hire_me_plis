"use client";

import type React from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ToastTone = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastViewportProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-red-200 bg-red-50 text-red-950",
  info: "border-neutral-200 bg-white text-neutral-950",
};

const toneIcons: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  error: <XCircle className="h-4 w-4 text-red-600" />,
  info: <Info className="h-4 w-4 text-neutral-600" />,
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";

        return (
          <div
            key={toast.id}
            className={`rounded-lg border p-3 shadow-lg ${toneStyles[tone]}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{toneIcons[tone]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs leading-relaxed opacity-80">
                    {toast.description}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Dismiss notification"
                onClick={() => onDismiss(toast.id)}
                className="-mr-1 -mt-1"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
