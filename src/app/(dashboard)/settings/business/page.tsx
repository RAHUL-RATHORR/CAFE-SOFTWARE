import { AuthError } from "@/components/auth/auth-error";
import {
  SettingsShell,
  RestaurantSettingsForm,
} from "@/components/settings";
import { getSettings } from "@/actions/settings";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const result = await getSettings();
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }
  if (!result.success) {
    return (
      <SettingsShell title="Business settings">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error.message}
        </div>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell
      title="Business settings"
      description="Legal name, GST, FSSAI, address, and business status"
    >
      <RestaurantSettingsForm settings={result.data.restaurant} mode="business" />
    </SettingsShell>
  );
}
