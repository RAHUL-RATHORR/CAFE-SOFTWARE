"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  CreditCard,
  CalendarClock,
  Gauge,
  Sparkles,
  ArrowUpRight,
  KeyRound,
} from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { AppCard } from "@/components/cards/app-card";
import { StatCard } from "@/components/cards/stat-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  SAAS_STATUS_LABELS,
  SAAS_STATUS_VARIANTS,
  SAAS_FEATURE_LABELS,
  BILLING_CYCLE_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_VARIANTS,
  USAGE_METRIC_LABELS,
} from "@/config/subscription";
import {
  formatMoney,
  formatSubscriptionDate,
  usagePercent,
  isFeatureAvailable,
  validateLicense,
} from "@/lib/subscription";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { SubscriptionDashboardSummary } from "@/types/subscription";
import type { UsageMetricKey } from "@/types/subscription";

type SubscriptionDashboardViewProps = {
  summary: SubscriptionDashboardSummary;
  errorMessage?: string | null;
};

const USAGE_KEYS: UsageMetricKey[] = [
  "users",
  "branches",
  "orders",
  "menuItems",
  "customers",
  "inventoryItems",
];

export function SubscriptionDashboardView({
  summary,
  errorMessage,
}: SubscriptionDashboardViewProps) {
  const canManage = useHasPermission([
    "subscription.manage",
    "subscription.update",
  ]);
  const license = validateLicense(summary.subscription);

  return (
    <PageContainer
      title="Subscription"
      description="Plan, license, usage, and billing foundations for your restaurant."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/subscription/plans"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Plans
          </Link>
          <Link
            href="/subscription/usage"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Usage
          </Link>
          <Link
            href="/subscription/billing"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Billing
          </Link>
        </div>
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
            title="Current plan"
            value={summary.currentPlan?.name ?? "None"}
            accent="primary"
            icon={<CreditCard className="size-4" />}
            description={
              summary.subscription
                ? BILLING_CYCLE_LABELS[summary.subscription.billingCycle]
                : "Assign a plan to get started"
            }
          />
          <StatCard
            title="Days remaining"
            value={
              summary.daysRemaining != null
                ? String(summary.daysRemaining)
                : "—"
            }
            accent="warning"
            icon={<CalendarClock className="size-4" />}
            description={
              summary.renewalDate
                ? `Renews ${formatSubscriptionDate(summary.renewalDate)}`
                : "No renewal date"
            }
          />
          <StatCard
            title="License"
            value={license.valid ? "Valid" : "Invalid"}
            accent={license.valid ? "success" : "danger"}
            icon={<KeyRound className="size-4" />}
            description={license.reason}
          />
          <StatCard
            title="Orders this month"
            value={String(summary.usage?.orders ?? 0)}
            accent="success"
            icon={<Gauge className="size-4" />}
            description={
              summary.limits
                ? `Limit ${summary.limits.maxOrdersPerMonth}`
                : "No limit data"
            }
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <AppCard
            title="Plan details"
            description="Active subscription overview"
            className="lg:col-span-2"
            action={
              summary.subscription ? (
                <DsBadge
                  variant={SAAS_STATUS_VARIANTS[summary.subscription.status]}
                  size="sm"
                >
                  {SAAS_STATUS_LABELS[summary.subscription.status]}
                </DsBadge>
              ) : null
            }
          >
            {summary.subscription && summary.currentPlan ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <Detail
                  label="Plan"
                  value={`${summary.currentPlan.name} (${summary.currentPlan.slug})`}
                />
                <Detail
                  label="Price"
                  value={`${formatMoney(summary.currentPlan.monthlyPrice, summary.currentPlan.currency)} / mo`}
                />
                <Detail
                  label="Trial end"
                  value={formatSubscriptionDate(summary.subscription.trialEnd)}
                />
                <Detail
                  label="Renewal"
                  value={formatSubscriptionDate(summary.subscription.renewalDate)}
                />
                <Detail
                  label="License key"
                  value={
                    <span className="font-mono text-xs">
                      {summary.subscription.licenseKey}
                    </span>
                  }
                />
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No subscription yet. Choose a plan to activate trial or paid
                access.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/subscription/plans"
                className={cn(buttonVariants(), "rounded-xl")}
              >
                {summary.subscription ? "Change plan" : "Choose a plan"}
              </Link>
              <Link
                href="/subscription/history"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-xl"
                )}
              >
                History
              </Link>
            </div>
          </AppCard>

          <AppCard
            title="Upgrade"
            description="Unlock more capacity and features"
            action={<Sparkles className="size-4 text-primary" />}
          >
            {summary.upgradeAvailable ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Higher tiers are available with more branches, users, and
                  advanced features.
                </p>
                <Link
                  href="/subscription/plans"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-4 inline-flex rounded-xl"
                  )}
                >
                  View upgrades
                  <ArrowUpRight className="size-4" />
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You are on the highest available plan or no paid upgrades exist.
              </p>
            )}
            {!canManage.allowed ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Plan changes require subscription manage permission.
              </p>
            ) : null}
          </AppCard>
        </div>

        <AppCard title="Usage" description="Current period metrics vs plan limits">
          {summary.usage && summary.limits ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {USAGE_KEYS.map((key) => {
                const used = summary.usage![key];
                const limit =
                  key === "users"
                    ? summary.limits!.maxUsers
                    : key === "branches"
                      ? summary.limits!.maxBranches
                      : key === "orders"
                        ? summary.limits!.maxOrdersPerMonth
                        : key === "menuItems"
                          ? summary.limits!.maxMenuItems
                          : 0;
                const pct = limit > 0 ? usagePercent(used, limit) : 0;
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-border/70 p-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {USAGE_METRIC_LABELS[key]}
                      </span>
                      <span className="text-muted-foreground">
                        {used}
                        {limit > 0 ? ` / ${limit}` : ""}
                      </span>
                    </div>
                    {limit > 0 ? (
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Usage metrics will appear after a plan is assigned.
            </p>
          )}
        </AppCard>

        <AppCard
          title="Feature access"
          description="Plan features and override foundation"
        >
          <div className="flex flex-wrap gap-2">
            {summary.currentPlan?.features.map((feature) => (
              <DsBadge
                key={feature}
                variant={
                  isFeatureAvailable(
                    feature,
                    summary.featureAccess,
                    summary.currentPlan?.features
                  )
                    ? "success"
                    : "secondary"
                }
                size="sm"
              >
                {SAAS_FEATURE_LABELS[feature]}
              </DsBadge>
            )) ?? (
              <p className="text-sm text-muted-foreground">
                No features enabled.
              </p>
            )}
          </div>
        </AppCard>

        <AppCard
          title="Recent invoices"
          description="Billing history foundation"
          action={
            <Link
              href="/subscription/billing"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-xl"
              )}
            >
              View all
            </Link>
          }
        >
          {summary.recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invoices yet. Assigning or renewing a plan creates invoice
              records.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Invoice</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-3 py-2 font-mono text-xs">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-3 py-2">
                        {formatMoney(invoice.amount, invoice.currency)}
                      </td>
                      <td className="px-3 py-2">
                        <DsBadge
                          variant={INVOICE_STATUS_VARIANTS[invoice.status]}
                          size="sm"
                        >
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </DsBadge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatSubscriptionDate(invoice.issuedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>
      </div>
    </PageContainer>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
