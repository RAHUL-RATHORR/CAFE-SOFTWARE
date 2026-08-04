import {
  DollarSign,
  ClipboardList,
  Table2,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { PageContainer } from "@/components/common/page-container";
import { StatCard } from "@/components/cards/stat-card";
import {
  WelcomeHeader,
  SalesOverviewCard,
  TodaySummaryCard,
  PopularMenuCard,
  KitchenActivityCard,
} from "@/components/dashboard";
import { RecentOrdersTable } from "@/features/dashboard/components/recent-orders-table";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import {
  RESTAURANT_PLACEHOLDER_NAME,
  dashboardStats,
  salesPeriodOptions,
  salesChartBars,
  todaySummary,
  popularMenuItems,
  kitchenActivity,
} from "@/features/dashboard/data/dummy-data";

const statIcons: Record<string, ReactNode> = {
  revenue: <DollarSign className="size-4" />,
  orders: <ClipboardList className="size-4" />,
  tables: <Table2 className="size-4" />,
  customers: <Users className="size-4" />,
};

export function DashboardView() {
  return (
    <PageContainer className="gap-6">
      <WelcomeHeader restaurantName={RESTAURANT_PLACEHOLDER_NAME} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            trend={stat.trend}
            accent={stat.accent}
            icon={statIcons[stat.id]}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesOverviewCard
            periods={salesPeriodOptions}
            barsByPeriod={salesChartBars}
          />
        </div>
        <TodaySummaryCard items={todaySummary} />
      </section>

      <section>
        <RecentOrdersTable />
      </section>

      <section>
        <QuickActions />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <PopularMenuCard items={popularMenuItems} />
        <KitchenActivityCard items={kitchenActivity} />
      </section>
    </PageContainer>
  );
}
