"use client";

import { ORDER_STATUS_LABELS, ORDER_TIMELINE_STATUSES } from "@/config/orders";
import { formatOrderDate } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type {
  OrderStatusHistoryEntry,
  RestaurantOrderStatus,
} from "@/types/order";

type OrderTimelineProps = {
  status: RestaurantOrderStatus;
  history: OrderStatusHistoryEntry[];
  createdAt: string;
  className?: string;
};

function latestTimestamp(
  history: OrderStatusHistoryEntry[],
  status: RestaurantOrderStatus,
  fallback?: string
): string | null {
  const matches = history.filter((entry) => entry.status === status);
  if (matches.length === 0) return fallback ?? null;
  return matches[matches.length - 1]?.changedAt ?? null;
}

export function OrderTimeline({
  status,
  history,
  createdAt,
  className,
}: OrderTimelineProps) {
  const cancelled = status === "cancelled";
  const steps: RestaurantOrderStatus[] = cancelled
    ? [...ORDER_TIMELINE_STATUSES.filter((step) => step !== "completed"), "cancelled"]
    : ORDER_TIMELINE_STATUSES;

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
          step === "pending"
            ? latestTimestamp(history, step, createdAt)
            : latestTimestamp(history, step);
        const note = history
          .filter((entry) => entry.status === step)
          .at(-1)?.note;

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
              <p
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {ORDER_STATUS_LABELS[step]}
              </p>
              {timestamp ? (
                <p className="text-xs text-muted-foreground">
                  {formatOrderDate(timestamp)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Not reached</p>
              )}
              {note ? (
                <p className="text-xs text-muted-foreground">{note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
