import { AdminSettingsView } from "@/components/admin";
import { getAdminFeatureFlags } from "@/actions/admin";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const result = await getAdminFeatureFlags();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <AdminSettingsView
      flags={result.success ? result.data : []}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
