import { SubscriptionDashboardView } from "@/components/subscription";
import { getSubscriptionDashboard } from "@/actions/subscription";
import { AuthError } from "@/components/auth/auth-error";
import type { SubscriptionDashboardSummary } from "@/types/subscription";

export const dynamic = "force-dynamic";

const emptySummary: SubscriptionDashboardSummary = {
  currentPlan: null,
  subscription: null,
  daysRemaining: null,
  renewalDate: null,
  usage: null,
  limits: null,
  featureAccess: null,
  recentInvoices: [],
  upgradeAvailable: false,
  access: {
    subscription: null,
    plan: null,
    usage: null,
    limits: null,
    featureAccess: null,
    effectiveStatus: "missing",
    isActive: false,
    isTrialActive: false,
    isExpired: true,
    isInGracePeriod: false,
    daysRemaining: null,
    warnings: [],
  },
  limitChecks: [],
};

export default async function SubscriptionPage() {
  const result = await getSubscriptionDashboard();

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <SubscriptionDashboardView
      summary={result.success ? result.data : emptySummary}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
