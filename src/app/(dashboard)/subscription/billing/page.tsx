import { SubscriptionBillingView } from "@/components/subscription";
import { getBillingHistory } from "@/actions/subscription";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

export default async function SubscriptionBillingPage() {
  const result = await getBillingHistory();

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <SubscriptionBillingView
      invoices={result.success ? result.data : []}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
