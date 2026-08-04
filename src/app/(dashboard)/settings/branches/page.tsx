import { AuthError } from "@/components/auth/auth-error";
import { BranchesSettingsHub } from "@/components/branches";
import { BranchSettingsForm, SettingsShell } from "@/components/settings";
import { getSettings } from "@/actions/settings";

export const dynamic = "force-dynamic";

export default async function BranchesSettingsPage() {
  const result = await getSettings();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <SettingsShell
      title="Branch settings"
      description="Outlet defaults plus the existing branch settings hub"
    >
      {result.success ? (
        <BranchSettingsForm settings={result.data.branch} />
      ) : (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error.message}
        </div>
      )}
      <BranchesSettingsHub embedded />
    </SettingsShell>
  );
}
