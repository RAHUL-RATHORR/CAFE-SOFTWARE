import { AdminRevenueView } from "@/components/admin";
import { getAdminRevenue } from "@/actions/admin";
import { AuthError } from "@/components/auth/auth-error";
import type { AdminRevenueSummary } from "@/types/admin";

export const dynamic = "force-dynamic";

const empty: AdminRevenueSummary = {
  monthlyRevenue: 0,
  annualRevenue: 0,
  paidInvoices: 0,
  openInvoices: 0,
  revenueByMonth: [],
  revenueByPlan: [],
};

export default async function AdminRevenuePage() {
  const result = await getAdminRevenue();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <AdminRevenueView
      summary={result.success ? result.data : empty}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
