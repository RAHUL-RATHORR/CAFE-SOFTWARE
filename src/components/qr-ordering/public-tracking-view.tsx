"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PublicMenuShell } from "@/components/qr-ordering/public-menu-shell";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import { trackOrder } from "@/actions/qr-ordering";
import { PUBLIC_ORDER_STATUS_LABELS } from "@/config/qr-ordering";
import { cn } from "@/lib/utils";
import type { PublicOrderTrackPayload } from "@/types/qr-ordering";

type PublicTrackingViewProps = {
  restaurantParam: string;
  restaurantName: string;
  tableParam?: string;
  tableLabel?: string | null;
  initialToken?: string;
  initialPayload?: PublicOrderTrackPayload | null;
};

export function PublicTrackingView({
  restaurantParam,
  restaurantName,
  tableParam,
  tableLabel,
  initialToken = "",
  initialPayload = null,
}: PublicTrackingViewProps) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [payload, setPayload] = useState(initialPayload);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function lookup() {
    startTransition(async () => {
      const result = await trackOrder(restaurantParam, token.trim());
      if (!result.success) {
        setPayload(null);
        setError(result.error.message);
        return;
      }
      setError(null);
      setPayload(result.data);
      router.replace(
        `?token=${encodeURIComponent(token.trim())}`,
        { scroll: false }
      );
    });
  }

  return (
    <PublicMenuShell
      restaurantSlug={restaurantParam}
      restaurantName={restaurantName}
      tableParam={tableParam}
      tableLabel={tableLabel}
      active="tracking"
    >
      <div className="space-y-4">
        <AppCard
          title="Track your order"
          description="Enter the tracking token from checkout"
          contentClassName="flex flex-col gap-2 sm:flex-row"
        >
          <Input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Tracking token"
            className="rounded-xl"
          />
          <Button
            type="button"
            className="rounded-xl"
            disabled={isPending || !token.trim()}
            onClick={lookup}
          >
            {isPending ? "Looking up…" : "Track"}
          </Button>
        </AppCard>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!payload && !error ? (
          <EmptyState
            title="No order loaded"
            description="Paste your tracking token to see live kitchen progress."
          />
        ) : null}

        {payload ? (
          <>
            <AppCard
              title={`Order ${payload.placeholder.orderNumber}`}
              description={
                payload.placeholder.guestName
                  ? `Guest: ${payload.placeholder.guestName}`
                  : "Guest order"
              }
              contentClassName="space-y-3"
            >
              <div className="flex flex-wrap gap-2">
                <DsBadge variant="info" size="sm">
                  {PUBLIC_ORDER_STATUS_LABELS[payload.placeholder.status]}
                </DsBadge>
                <DsBadge variant="secondary" size="sm">
                  ETA {payload.placeholder.estimatedMinutes ?? "—"} min
                  (placeholder)
                </DsBadge>
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
                        <p className="text-xs text-muted-foreground">
                          Current status
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </AppCard>

            <AppCard
              title="Customer profile foundation"
              description="Order history, favorites, preferences, and loyalty are placeholders."
              contentClassName="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"
            >
              <p>Order history placeholder</p>
              <p>Favorite items placeholder</p>
              <p>Saved preferences placeholder</p>
              <p>Loyalty placeholder</p>
            </AppCard>
          </>
        ) : null}
      </div>
    </PublicMenuShell>
  );
}
