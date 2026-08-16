"use client";

import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { AppCard } from "@/components/cards/app-card";
import { StatCard } from "@/components/cards/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { USAGE_METRIC_LABELS } from "@/config/subscription";
import { usagePercent, evaluateTenantLimits } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import type {
  LimitCheckResult,
  SubscriptionPlanEntity,
  TenantLimitSnapshot,
  UsageMetrics,
} from "@/types/subscription";
import { Gauge } from "lucide-react";

type SubscriptionUsageViewProps = {
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  checks: LimitCheckResult[];
  plan: SubscriptionPlanEntity | null;
  errorMessage?: string | null;
};

export function SubscriptionUsageView({
  usage,
  limits,
  checks,
  plan,
  errorMessage,
}: SubscriptionUsageViewProps) {
  const computedChecks =
    checks.length > 0
      ? checks
      : evaluateTenantLimits({ limits, usage });

  return (
    <PageContainer
      title="Usage"
      description="Track consumption against your plan limits. Creating new resources is blocked when a limit is reached."
      actions={
        <Link
          href="/subscription"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          Dashboard
        </Link>
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Period"
            value={usage?.periodKey ?? "—"}
            accent="primary"
            icon={<Gauge className="size-4" />}
            description={plan ? `Plan: ${plan.name}` : "No plan"}
          />
          <StatCard
            title="Users"
            value={String(usage?.users ?? 0)}
            accent="success"
            description={
              limits ? `Limit ${limits.maxUsers}` : "No limit"
            }
          />
          <StatCard
            title="Branches"
            value={String(usage?.branches ?? 0)}
            accent="warning"
            description={
              limits ? `Limit ${limits.maxBranches}` : "No limit"
            }
          />
          <StatCard
            title="Orders"
            value={String(usage?.orders ?? 0)}
            accent="danger"
            description={
              limits ? `Limit ${limits.maxOrdersPerMonth}/mo` : "No limit"
            }
          />
        </div>

        <AppCard
          title="Metric breakdown"
          description="Includes storage and API request placeholders"
        >
          {!usage ? (
            <p className="text-sm text-muted-foreground">
              No usage data yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  "users",
                  "branches",
                  "orders",
                  "storage",
                  "apiRequests",
                  "menuItems",
                  "customers",
                  "inventoryItems",
                ] as const
              ).map((key) => {
                const used = usage[key];
                const limit =
                  key === "users"
                    ? limits?.maxUsers
                    : key === "branches"
                      ? limits?.maxBranches
                      : key === "orders"
                        ? limits?.maxOrdersPerMonth
                        : key === "menuItems"
                          ? limits?.maxMenuItems
                          : key === "storage"
                            ? limits?.storageLimit
                            : undefined;
                const pct =
                  limit && limit > 0 ? usagePercent(used, limit) : null;
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-border/70 p-4"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {USAGE_METRIC_LABELS[key]}
                      </span>
                      <span className="text-muted-foreground">
                        {used}
                        {limit != null ? ` / ${limit}` : ""}
                      </span>
                    </div>
                    {pct != null ? (
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Tracking only — no plan limit mapped
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </AppCard>

        <AppCard
          title="Limit checks"
          description="Reusable enforcement architecture (wouldBlock is informational)"
        >
          {computedChecks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Assign a plan to evaluate limits.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {computedChecks.map((check) => (
                <li
                  key={String(check.metric)}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                >
                  <span>{check.message}</span>
                  <span
                    className={
                      check.wouldBlock
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {check.wouldBlock ? "Would block" : "OK"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </div>
    </PageContainer>
  );
}
