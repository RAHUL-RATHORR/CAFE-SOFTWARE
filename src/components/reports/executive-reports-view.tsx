"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { StatCard } from "@/components/cards/stat-card";
import { AppCard } from "@/components/cards/app-card";
import { ReportFiltersBar } from "@/components/reports/report-filters-bar";
import { ReportChart } from "@/components/reports/report-charts";
import { formatReportMoney } from "@/lib/reports";
import type { ExecutiveDashboardData } from "@/types/report";

const kpiIcons: Record<string, ReactNode> = {
  "total-revenue": <DollarSign className="size-4" />,
  "net-revenue": <TrendingUp className="size-4" />,
  "gross-sales": <DollarSign className="size-4" />,
  "orders-today": <ShoppingBag className="size-4" />,
  "orders-month": <ShoppingBag className="size-4" />,
  aov: <TrendingUp className="size-4" />,
  "active-customers": <Users className="size-4" />,
  "new-customers": <Users className="size-4" />,
  "inventory-value": <Package className="size-4" />,
  "low-stock": <AlertTriangle className="size-4" />,
  "purchase-cost": <Package className="size-4" />,
  "profit-placeholder": <TrendingUp className="size-4" />,
};

type ExecutiveReportsViewProps = {
  data: ExecutiveDashboardData;
  query: {
    preset: string;
    dateFrom: string;
    dateTo: string;
    orderType: string;
    orderStatus: string;
    paymentMethod: string;
    q: string;
  };
  errorMessage?: string | null;
};

export function ExecutiveReportsView({
  data,
  query,
  errorMessage,
}: ExecutiveReportsViewProps) {
  return (
    <PageContainer
      title="Reports & Analytics"
      description="Executive KPIs across sales, guests, inventory, and kitchen."
    >
      <div className="space-y-6">
        <ReportFiltersBar kind="executive" query={query} />

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((kpi) => (
            <StatCard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              accent={kpi.accent}
              trend={kpi.trend}
              icon={kpiIcons[kpi.id]}
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppCard title="Revenue trend" description="Completed order totals">
            <ReportChart type="area" points={data.revenueTrend} />
          </AppCard>
          <AppCard title="Orders by status" description="Volume mix">
            <ReportChart type="donut" points={data.ordersByStatus} />
          </AppCard>
          <AppCard title="Sales by order type" description="Channel mix">
            <ReportChart type="bar" points={data.salesByOrderType} />
          </AppCard>
          <AppCard title="Kitchen performance" description="Ticket statuses">
            <ReportChart type="bar" points={data.kitchenPerformance} />
          </AppCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <NamedListCard
            title="Top selling items"
            items={data.topSellingItems}
            href="/reports/sales"
          />
          <NamedListCard
            title="Top customers"
            items={data.topCustomers}
            href="/reports/customers"
            money
          />
          <NamedListCard
            title="Top categories / types"
            items={data.topCategories}
            href="/reports/sales"
            money
          />
          <NamedListCard
            title="Recent sales"
            items={data.recentSales}
            href="/orders"
            money
          />
          <NamedListCard
            title="Recent payments"
            items={data.recentPayments}
            href="/reports/payments"
            money
          />
          <NamedListCard
            title="Recent purchases"
            items={data.recentPurchases}
            href="/reports/purchases"
            money
          />
          <NamedListCard
            title="Low stock"
            items={data.lowStockItems}
            href="/reports/inventory"
          />
        </div>

        <AppCard
          title="Heatmap placeholder"
          description="Spatial heatmaps arrive with advanced analytics"
        >
          <div className="grid h-40 grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, index) => (
              <div
                key={index}
                className="rounded-md bg-primary/10"
                style={{ opacity: 0.2 + ((index * 17) % 80) / 100 }}
              />
            ))}
          </div>
        </AppCard>
      </div>
    </PageContainer>
  );
}

function NamedListCard({
  title,
  items,
  href,
  money,
}: {
  title: string;
  items: ExecutiveDashboardData["topSellingItems"];
  href: string;
  money?: boolean;
}) {
  return (
    <AppCard
      title={title}
      action={
        <Link href={href} className="text-xs text-primary hover:underline">
          Open
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.label}</p>
                {item.meta ? (
                  <p className="text-xs text-muted-foreground">{item.meta}</p>
                ) : null}
              </div>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {money ? formatReportMoney(item.value) : item.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}
