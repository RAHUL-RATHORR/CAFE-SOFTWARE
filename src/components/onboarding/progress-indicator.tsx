"use client";

import { cn } from "@/lib/utils";

type ProgressIndicatorProps = {
  value: number;
  label?: string;
  className?: string;
};

export function ProgressIndicator({
  value,
  label = "Onboarding progress",
  className,
}: ProgressIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <span aria-live="polite">{clamped}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label={label}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
