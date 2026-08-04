import { AuthError } from "@/components/auth/auth-error";
import { SettingsShell, ReceiptSettingsForm } from "@/components/settings";
import { getSettings } from "@/actions/settings";

export const dynamic = "force-dynamic";

export default async function ReceiptSettingsPage() {
  const result = await getSettings();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }
  if (!result.success) {
    return (
      <SettingsShell title="Receipt settings">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error.message}
        </div>
      </SettingsShell>
    );
  }
  return (
    <SettingsShell title="Receipt settings" description="Layout, prefixes, notes, and paper size">
      <ReceiptSettingsForm settings={result.data.receipt} />
    </SettingsShell>
  );
}
