"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { trackOrderByPublicToken } from "@/actions/qr-ordering";
import { PUBLIC_ORDER_STATUS_LABELS } from "@/config/qr-ordering";
import {
  DEFAULT_POLLING_STRATEGY,
  nextPollingInterval,
} from "@/lib/realtime/polling";
import { cn } from "@/lib/utils";
import type { PublicOrderTrackPayload } from "@/types/qr-ordering";

type PublicOrderStatusViewProps = {
  publicOrderToken: string;
  initialPayload?: PublicOrderTrackPayload | null;
};

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function PublicOrderStatusView({
  publicOrderToken,
  initialPayload = null,
}: PublicOrderStatusViewProps) {
  const [payload, setPayload] = useState(initialPayload);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef(DEFAULT_POLLING_STRATEGY.intervalMs);

  function refresh(hadError = false) {
    startTransition(async () => {
      const result = await trackOrderByPublicToken(publicOrderToken);
      if (!result.success) {
        setError(result.error.message);
        intervalRef.current = nextPollingInterval(
          intervalRef.current,
          DEFAULT_POLLING_STRATEGY,
          true
        );
        return;
      }
      setError(null);
      setPayload(result.data);
      intervalRef.current = nextPollingInterval(
        intervalRef.current,
        DEFAULT_POLLING_STRATEGY,
        hadError
      );
    });
  }

  useEffect(() => {
    refresh(false);
    const timer = window.setInterval(() => {
      refresh(false);
    }, intervalRef.current);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicOrderToken]);

  if (!payload && error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Order not found"
          description={error}
          action={
            <Link href="/">
              <Button className="rounded-xl">Go home</Button>
            </Link>
          }
        />
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        Loading order status…
      </main>
    );
  }

  const status = payload.order?.status ?? payload.placeholder.status;
  const currency = "INR";

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">
          {payload.restaurantName ?? "Your order"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {payload.tableLabel
            ? `Table ${payload.tableLabel}`
            : "Table order tracking"}
        </p>
      </div>

      <AppCard
        title={`Order ${payload.placeholder.orderNumber}`}
        description={
          payload.placeholder.guestName
            ? `Guest: ${payload.placeholder.guestName}`
            : "Guest order"
        }
        contentClassName="space-y-4"
      >
        <div className="flex flex-wrap gap-2">
          <DsBadge variant="info" size="sm">
            {PUBLIC_ORDER_STATUS_LABELS[status]}
          </DsBadge>
          {payload.order ? (
            <DsBadge variant="secondary" size="sm">
              {formatMoney(payload.order.grandTotal, currency)}
            </DsBadge>
          ) : null}
        </div>

        <ol className="space-y-0">
          {payload.timeline.map((step, index) => (
            <li
              key={`${step.status}-${index}`}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {index < payload.timeline.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-border"
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 mt-0.5 size-[18px] shrink-0 rounded-full border-2",
                  step.active
                    ? "border-primary bg-primary"
                    : step.completed
                      ? "border-primary bg-primary/30"
                      : "border-border bg-background"
                )}
              />
              <div>
                <p className="text-sm font-medium">{step.label}</p>
                {step.active ? (
                  <p className="text-xs text-muted-foreground">Current status</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl"
          disabled={isPending}
          onClick={() => refresh(false)}
        >
          {isPending ? "Refreshing…" : "Refresh status"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Updates every ~{Math.round(DEFAULT_POLLING_STRATEGY.intervalMs / 1000)}s
        </p>
      </AppCard>
    </main>
  );
}
