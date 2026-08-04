import { AdminPlansView } from "@/components/admin";
import { getAdminPlans } from "@/actions/admin";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const result = await getAdminPlans();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <AdminPlansView
      plans={result.success ? result.data : []}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
