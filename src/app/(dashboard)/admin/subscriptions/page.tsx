import { AdminSubscriptionsView } from "@/components/admin";
import { getAdminSubscriptionsOverview } from "@/actions/admin";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSubscriptionsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const restaurantId = Array.isArray(params.restaurantId)
    ? params.restaurantId[0]
    : params.restaurantId;

  const result = await getAdminSubscriptionsOverview();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <AdminSubscriptionsView
      tenants={result.success ? result.data.tenants : []}
      plans={result.success ? result.data.plans : []}
      selectedRestaurantId={restaurantId}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
