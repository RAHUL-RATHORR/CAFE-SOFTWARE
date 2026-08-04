import { SubscriptionHistoryView } from "@/components/subscription";
import {
  getBillingHistory,
  getCurrentSubscription,
} from "@/actions/subscription";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

export default async function SubscriptionHistoryPage() {
  const [invoices, subscription] = await Promise.all([
    getBillingHistory(),
    getCurrentSubscription(),
  ]);

  if (
    (!invoices.success && invoices.error.code === "UNAUTHORIZED") ||
    (!subscription.success && subscription.error.code === "UNAUTHORIZED")
  ) {
    return <AuthError code="session_expired" />;
  }
  if (
    (!invoices.success && invoices.error.code === "FORBIDDEN") ||
    (!subscription.success && subscription.error.code === "FORBIDDEN")
  ) {
    return <AuthError code="forbidden" />;
  }

  return (
    <SubscriptionHistoryView
      invoices={invoices.success ? invoices.data : []}
      subscription={subscription.success ? subscription.data : null}
      errorMessage={
        !invoices.success
          ? invoices.error.message
          : !subscription.success
            ? subscription.error.message
            : null
      }
    />
  );
}
