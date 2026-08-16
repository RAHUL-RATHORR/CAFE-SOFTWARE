"use client";

import Link from "next/link";
import { AlertTriangle, Info } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { buildSubscriptionNotifications } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import type { RestaurantSubscription } from "@/types/subscription";

type SubscriptionStatusBannerProps = {
  subscription: RestaurantSubscription | null;
  className?: string;
};

export function SubscriptionStatusBanner({
  subscription,
  className,
}: SubscriptionStatusBannerProps) {
  const notifications = buildSubscriptionNotifications(subscription);
  if (notifications.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {notifications.map((item) => {
        const tone =
          item.severity === "danger"
            ? "border-destructive/30 bg-destructive/5 text-destructive"
            : item.severity === "warning"
              ? "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100"
              : "border-primary/30 bg-primary/5 text-foreground";
        const Icon = item.severity === "info" ? Info : AlertTriangle;
        return (
          <div
            key={item.kind}
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
              tone
            )}
            role="status"
          >
            <div className="flex gap-3">
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-sm opacity-90">{item.description}</p>
              </div>
            </div>
            <Link
              href="/subscription/plans"
              className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}
            >
              View plans
            </Link>
          </div>
        );
      })}
    </div>
  );
}
