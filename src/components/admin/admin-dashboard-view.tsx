"use client";

import Link from "next/link";
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  TriangleAlert,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/cards/stat-card";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { ReportBarChart, ReportLineChart } from "@/components/reports/report-charts";
import { buttonVariants } from "@/components/ui/button";
import { formatAdminDate, formatAdminMoney } from "@/lib/admin";
import { cn } from "@/lib/utils";
import type { AdminDashboardSummary } from "@/types/admin";

type AdminDashboardViewProps = {
  summary: AdminDashboardSummary;
  errorMessage?: string | null;
};

export function AdminDashboardView({
  summary,
  errorMessage,
}: AdminDashboardViewProps) {
  return (
    <AdminShell
      title="Platform dashboard"
      description="Global health across tenants, subscriptions, and revenue."
      actions={
        <Link
          href="/admin/restaurants"
          className={cn(buttonVariants(), "rounded-xl")}
        >
          Manage restaurants
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
            title="Total restaurants"
            value={String(summary.totalRestaurants)}
            accent="primary"
            icon={<Building2 className="size-4" />}
          />
          <StatCard
            title="Active restaurants"
            value={String(summary.activeRestaurants)}
            accent="success"
            icon={<Activity className="size-4" />}
          />
          <StatCard
            title="Trials"
            value={String(summary.trialRestaurants)}
            accent="warning"
            icon={<CreditCard className="size-4" />}
          />
          <StatCard
            title="Expired / cancelled"
            value={String(summary.expiredSubscriptions)}
            accent="danger"
            icon={<TriangleAlert className="size-4" />}
          />
          <StatCard
            title="Monthly revenue"
            value={formatAdminMoney(summary.monthlyRevenue)}
            accent="success"
          />
          <StatCard
            title="Annual revenue"
            value={formatAdminMoney(summary.annualRevenue)}
            accent="primary"
          />
          <StatCard
            title="Orders today"
            value={String(summary.ordersToday)}
            accent="warning"
          />
          <StatCard
            title="Users online"
            value={String(summary.usersOnlinePlaceholder)}
            description="Placeholder"
            accent="primary"
            icon={<Users className="size-4" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <AppCard
            title="System status"
            description="Database & application"
            className="lg:col-span-1"
          >
            <DsBadge
              variant={
                summary.systemStatus === "healthy"
                  ? "success"
                  : summary.systemStatus === "degraded"
                    ? "warning"
                    : "danger"
              }
            >
              {summary.systemStatus}
            </DsBadge>
            <p className="mt-3 text-sm text-muted-foreground">
              API usage placeholder: {summary.apiUsagePlaceholder}
            </p>
            <Link
              href="/admin/system"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 rounded-xl"
              )}
            >
              Open system health
            </Link>
          </AppCard>

          <AppCard
            title="Revenue (6 mo)"
            description="Paid SaaS invoices"
            className="lg:col-span-2"
          >
            <ReportLineChart
              points={summary.revenueChart.map((point) => ({
                label: point.label,
                value: point.value,
              }))}
            />
          </AppCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppCard title="Subscription distribution" description="By SaaS status">
            <ReportBarChart
              points={summary.subscriptionDistribution.map((point) => ({
                label: point.label,
                value: point.value,
              }))}
            />
          </AppCard>
          <AppCard title="Latest signups" description="Newest restaurants">
            <ul className="space-y-2 text-sm">
              {summary.latestSignups.length === 0 ? (
                <li className="text-muted-foreground">No restaurants yet.</li>
              ) : (
                summary.latestSignups.map((tenant) => (
                  <li
                    key={tenant.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tenant.email}
                      </p>
                    </div>
                    <DsBadge variant="secondary" size="sm">
                      {tenant.subscriptionPlan}
                    </DsBadge>
                  </li>
                ))
              )}
            </ul>
          </AppCard>
        </div>

        <AppCard title="Recent activities" description="Audit trail preview">
          {summary.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No audit events yet. Admin actions will appear here.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.recentActivities.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border/60 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{item.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatAdminDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{item.message}</p>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </div>
    </AdminShell>
  );
}
