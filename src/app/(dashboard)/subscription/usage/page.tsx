import { SubscriptionUsageView } from "@/components/subscription";
import {
  getUsage,
  getSubscriptionDashboard,
} from "@/actions/subscription";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

export default async function SubscriptionUsagePage() {
  const [usageResult, dashboard] = await Promise.all([
    getUsage(),
    getSubscriptionDashboard(),
  ]);

  if (
    (!usageResult.success && usageResult.error.code === "UNAUTHORIZED") ||
    (!dashboard.success && dashboard.error.code === "UNAUTHORIZED")
  ) {
    return <AuthError code="session_expired" />;
  }
  if (
    (!usageResult.success && usageResult.error.code === "FORBIDDEN") ||
    (!dashboard.success && dashboard.error.code === "FORBIDDEN")
  ) {
    return <AuthError code="forbidden" />;
  }

  return (
    <SubscriptionUsageView
      usage={usageResult.success ? usageResult.data.usage : null}
      limits={usageResult.success ? usageResult.data.limits : null}
      checks={usageResult.success ? usageResult.data.checks : []}
      plan={dashboard.success ? dashboard.data.currentPlan : null}
      errorMessage={
        !usageResult.success
          ? usageResult.error.message
          : !dashboard.success
            ? dashboard.error.message
            : null
      }
    />
  );
}
