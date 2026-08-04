import { AdminSystemView } from "@/components/admin";
import { getAdminSystemHealth } from "@/actions/admin";
import { AuthError } from "@/components/auth/auth-error";
import type { AdminSystemHealth } from "@/types/admin";

export const dynamic = "force-dynamic";

const empty: AdminSystemHealth = {
  databaseStatus: "unknown",
  applicationStatus: "ok",
  storageStatusPlaceholder: "unknown",
  errorRatePlaceholder: 0,
  serverUptimePlaceholder: "—",
  latestDeploymentsPlaceholder: [],
  checkedAt: new Date().toISOString(),
};

export default async function AdminSystemPage() {
  const result = await getAdminSystemHealth();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <AdminSystemView
      health={result.success ? result.data : empty}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
