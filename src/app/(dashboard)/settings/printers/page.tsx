import { AuthError } from "@/components/auth/auth-error";
import { SettingsShell, PrinterSettingsForm } from "@/components/settings";
import { getSettings } from "@/actions/settings";

export const dynamic = "force-dynamic";

export default async function PrinterSettingsPage() {
  const result = await getSettings();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }
  if (!result.success) {
    return (
      <SettingsShell title="Printer settings">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error.message}
        </div>
      </SettingsShell>
    );
  }
  return (
    <SettingsShell
      title="Printer settings"
      description="Printer roles and connection foundation — no hardware integration"
    >
      <PrinterSettingsForm settings={result.data.printers} />
    </SettingsShell>
  );
}
