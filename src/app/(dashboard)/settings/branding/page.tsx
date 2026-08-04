import { AuthError } from "@/components/auth/auth-error";
import { SettingsShell, BrandSettingsForm } from "@/components/settings";
import { getSettings } from "@/actions/settings";

export const dynamic = "force-dynamic";

export default async function BrandingSettingsPage() {
  const result = await getSettings();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }
  if (!result.success) {
    return (
      <SettingsShell title="Branding settings">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error.message}
        </div>
      </SettingsShell>
    );
  }
  return (
    <SettingsShell
      title="Branding settings"
      description="Colors, logo, favicon, and brand theme"
    >
      <BrandSettingsForm settings={result.data.branding} />
    </SettingsShell>
  );
}
