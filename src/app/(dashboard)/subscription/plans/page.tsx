import { SubscriptionPlansView } from "@/components/subscription";
import {
  getPlans,
  getCurrentSubscription,
} from "@/actions/subscription";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

export default async function SubscriptionPlansPage() {
  const [plansResult, subResult] = await Promise.all([
    getPlans({ activeOnly: true }),
    getCurrentSubscription(),
  ]);

  if (
    (!plansResult.success && plansResult.error.code === "UNAUTHORIZED") ||
    (!subResult.success && subResult.error.code === "UNAUTHORIZED")
  ) {
    return <AuthError code="session_expired" />;
  }
  if (
    (!plansResult.success && plansResult.error.code === "FORBIDDEN") ||
    (!subResult.success && subResult.error.code === "FORBIDDEN")
  ) {
    return <AuthError code="forbidden" />;
  }

  return (
    <SubscriptionPlansView
      plans={plansResult.success ? plansResult.data : []}
      subscription={subResult.success ? subResult.data : null}
      errorMessage={
        !plansResult.success
          ? plansResult.error.message
          : !subResult.success
            ? subResult.error.message
            : null
      }
    />
  );
}
