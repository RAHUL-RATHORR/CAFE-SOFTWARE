"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StepHeaderProps = {
  title: string;
  description?: string;
  stepLabel?: string;
  action?: ReactNode;
  className?: string;
};

export function StepHeader({
  title,
  description,
  stepLabel,
  action,
  className,
}: StepHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="space-y-1.5">
        {stepLabel ? (
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            {stepLabel}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
