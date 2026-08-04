import { AuthError } from "@/components/auth/auth-error";
import { PreferencesView } from "@/components/preferences";
import {
  SettingsShell,
  SystemPreferencesForm,
} from "@/components/settings";
import { getSettings } from "@/actions/settings";

export const dynamic = "force-dynamic";

export default async function PreferencesSettingsPage() {
  const result = await getSettings();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <SettingsShell
      title="Preferences"
      description="Restaurant system preferences and local browser UI preferences"
    >
      {result.success ? (
        <SystemPreferencesForm settings={result.data.preferences} />
      ) : (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error.message}
        </div>
      )}
      <div className="rounded-xl border border-border/70 bg-muted/20 p-2">
        <PreferencesView embedded />
      </div>
    </SettingsShell>
  );
}
