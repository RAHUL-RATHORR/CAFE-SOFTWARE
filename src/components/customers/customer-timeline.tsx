"use client";

import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_VARIANTS,
} from "@/config/customers";
import { formatCustomerDateTime } from "@/lib/customers";
import { cn } from "@/lib/utils";
import type { CustomerStatusHistoryEntry } from "@/types/customer";
import { DsBadge } from "@/components/badges/ds-badge";

type CustomerTimelineProps = {
  history: CustomerStatusHistoryEntry[];
  createdAt: string;
  className?: string;
};

export function CustomerTimeline({
  history,
  createdAt,
  className,
}: CustomerTimelineProps) {
  const entries =
    history.length > 0
      ? [...history].sort(
          (a, b) =>
            new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
        )
      : [
          {
            status: "active" as const,
            changedAt: createdAt,
            changedBy: null,
            note: "Customer created",
          },
        ];

  return (
    <ol className={cn("space-y-0", className)}>
      {entries.map((entry, index) => (
        <li
          key={`${entry.status}-${entry.changedAt}-${index}`}
          className="relative flex gap-3 pb-5 last:pb-0"
        >
          {index < entries.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-border"
            />
          ) : null}
          <span className="relative z-10 mt-0.5 size-[18px] shrink-0 rounded-full border-2 border-primary bg-primary/20" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <DsBadge
                variant={CUSTOMER_STATUS_VARIANTS[entry.status]}
                size="sm"
              >
                {CUSTOMER_STATUS_LABELS[entry.status]}
              </DsBadge>
              <span className="text-xs text-muted-foreground">
                {formatCustomerDateTime(entry.changedAt)}
              </span>
            </div>
            {entry.note ? (
              <p className="text-sm text-muted-foreground">{entry.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
