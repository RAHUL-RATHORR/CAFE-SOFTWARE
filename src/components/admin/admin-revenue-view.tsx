"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/cards/stat-card";
import { AppCard } from "@/components/cards/app-card";
import { ReportBarChart, ReportLineChart } from "@/components/reports/report-charts";
import { formatAdminMoney } from "@/lib/admin";
import type { AdminRevenueSummary } from "@/types/admin";

type AdminRevenueViewProps = {
  summary: AdminRevenueSummary;
  errorMessage?: string | null;
};

export function AdminRevenueView({
  summary,
  errorMessage,
}: AdminRevenueViewProps) {
  return (
    <AdminShell
      title="Revenue"
      description="SaaS invoice foundations — no payment gateway connected."
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            title="Paid invoices"
            value={String(summary.paidInvoices)}
            accent="success"
          />
          <StatCard
            title="Open invoices"
            value={String(summary.openInvoices)}
            accent="warning"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppCard title="Revenue by month">
            <ReportLineChart
              points={summary.revenueByMonth.map((point) => ({
                label: point.label,
                value: point.value,
              }))}
            />
          </AppCard>
          <AppCard title="Revenue by plan">
            <ReportBarChart
              points={summary.revenueByPlan.map((point) => ({
                label: point.label,
                value: point.value,
              }))}
            />
          </AppCard>
        </div>
      </div>
    </AdminShell>
  );
}
