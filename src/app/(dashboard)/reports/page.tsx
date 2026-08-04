import { ExecutiveReportsView } from "@/components/reports";
import { AuthError } from "@/components/auth/auth-error";
import { getExecutiveDashboard } from "@/actions/reports";
import {
  parseReportSearchParams,
  toReportQuery,
} from "@/app/(dashboard)/reports/_lib/parse-filters";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseReportSearchParams(params);
  const result = await getExecutiveDashboard(filters);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const empty = {
    kpis: [],
    revenueTrend: [],
    ordersByStatus: [],
    salesByOrderType: [],
    topSellingItems: [],
    topCustomers: [],
    topCategories: [],
    recentSales: [],
    recentPayments: [],
    recentPurchases: [],
    lowStockItems: [],
    kitchenPerformance: [],
  };

  return (
    <ExecutiveReportsView
      data={result.success ? result.data : empty}
      query={toReportQuery(filters)}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
