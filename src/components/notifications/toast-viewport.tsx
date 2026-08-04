"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Undo2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { ToastItem, ToastTone } from "@/types";

const toneStyles: Record<ToastTone, string> = {
  success: "border-success/20",
  error: "border-destructive/20",
  warning: "border-warning/20",
  info: "border-primary/20",
  loading: "border-border",
};

const toneIcons: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismissToast = useToastStore((state) => state.dismissToast);
  const Icon = toneIcons[toast.tone];

  useEffect(() => {
    if (toast.persistent || toast.duration == null) return;
    const timer = window.setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-xl border bg-card p-4 shadow-lg",
        toneStyles[toast.tone]
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            toast.tone === "loading" && "animate-spin text-muted-foreground",
            toast.tone === "success" && "text-success",
            toast.tone === "error" && "text-destructive",
            toast.tone === "warning" && "text-warning",
            toast.tone === "info" && "text-primary"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>
          ) : null}
          {(toast.actionLabel || toast.undoLabel) && (
            <div className="mt-2 flex gap-2">
              {toast.actionLabel ? (
                <Button type="button" size="sm" variant="outline" className="h-7 rounded-lg">
                  {toast.actionLabel}
                </Button>
              ) : null}
              {toast.undoLabel ? (
                <Button type="button" size="sm" variant="ghost" className="h-7 rounded-lg gap-1">
                  <Undo2 className="size-3.5" aria-hidden />
                  {toast.undoLabel}
                </Button>
              ) : null}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-lg"
          aria-label="Dismiss notification"
          onClick={() => dismissToast(toast.id)}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
