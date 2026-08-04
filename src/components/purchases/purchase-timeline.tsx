"use client";

import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_VARIANTS,
  PURCHASE_TIMELINE_STATUSES,
} from "@/config/purchases";
import { formatPurchaseDateTime } from "@/lib/purchases";
import { cn } from "@/lib/utils";
import type {
  PurchaseStatus,
  PurchaseStatusHistoryEntry,
} from "@/types/purchase";
import { DsBadge } from "@/components/badges/ds-badge";

type PurchaseTimelineProps = {
  status: PurchaseStatus;
  history: PurchaseStatusHistoryEntry[];
  createdAt: string;
  className?: string;
};

function latestTimestamp(
  history: PurchaseStatusHistoryEntry[],
  status: PurchaseStatus,
  fallback?: string
): string | null {
  const matches = history.filter((entry) => entry.status === status);
  if (matches.length === 0) return fallback ?? null;
  return matches[matches.length - 1]?.changedAt ?? null;
}

export function PurchaseTimeline({
  status,
  history,
  createdAt,
  className,
}: PurchaseTimelineProps) {
  const cancelled = status === "cancelled";
  const steps: PurchaseStatus[] = cancelled
    ? [
        ...PURCHASE_TIMELINE_STATUSES.filter((step) => step !== "received"),
        "cancelled",
      ]
    : PURCHASE_TIMELINE_STATUSES;

  const currentIndex = steps.indexOf(status);

  return (
    <ol className={cn("space-y-0", className)}>
      {steps.map((step, index) => {
        const reached =
          cancelled && step === "cancelled"
            ? true
            : currentIndex >= 0 && index <= currentIndex;
        const isCurrent = step === status;
        const timestamp =
          step === "draft"
            ? latestTimestamp(history, step, createdAt)
            : latestTimestamp(history, step);
        const note = history.filter((entry) => entry.status === step).at(-1)
          ?.note;

        return (
          <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[9px] top-5 h-[calc(100%-12px)] w-px",
                  reached ? "bg-primary/50" : "bg-border"
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-0.5 size-[18px] shrink-0 rounded-full border-2",
                isCurrent
                  ? "border-primary bg-primary"
                  : reached
                    ? "border-primary bg-primary/20"
                    : "border-border bg-background"
              )}
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <DsBadge
                  variant={PURCHASE_STATUS_VARIANTS[step]}
                  size="sm"
                >
                  {PURCHASE_STATUS_LABELS[step]}
                </DsBadge>
                {timestamp ? (
                  <span className="text-xs text-muted-foreground">
                    {formatPurchaseDateTime(timestamp)}
                  </span>
                ) : null}
              </div>
              {note ? (
                <p className="text-sm text-muted-foreground">{note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
