import { AuthError } from "@/components/auth/auth-error";
import { SettingsShell, SecuritySettingsForm } from "@/components/settings";
import { getSettings } from "@/actions/settings";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const result = await getSettings();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }
  if (!result.success) {
    return (
      <SettingsShell title="Security settings">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error.message}
        </div>
      </SettingsShell>
    );
  }
  return (
    <SettingsShell
      title="Security settings"
      description="Password policy, sessions, and audit preferences"
    >
      <SecuritySettingsForm settings={result.data.security} />
    </SettingsShell>
  );
}
