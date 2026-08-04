import { AdminDashboardView } from "@/components/admin";
import { getAdminDashboard } from "@/actions/admin";
import { AuthError } from "@/components/auth/auth-error";
import type { AdminDashboardSummary } from "@/types/admin";

export const dynamic = "force-dynamic";

const empty: AdminDashboardSummary = {
  totalRestaurants: 0,
  activeRestaurants: 0,
  trialRestaurants: 0,
  expiredSubscriptions: 0,
  monthlyRevenue: 0,
  annualRevenue: 0,
  ordersToday: 0,
  usersOnlinePlaceholder: 0,
  apiUsagePlaceholder: 0,
  systemStatus: "healthy",
  recentActivities: [],
  latestSignups: [],
  revenueChart: [],
  subscriptionDistribution: [],
};

export default async function AdminDashboardPage() {
  const result = await getAdminDashboard();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <AdminDashboardView
      summary={result.success ? result.data : empty}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
