import { NotificationPreferencesView } from "@/components/notifications/notification-preferences-view";
import { getNotificationPreferences } from "@/actions/notification";
import { AuthError } from "@/components/auth/auth-error";
import { DEFAULT_CATEGORY_PREFERENCES } from "@/config/notification";
import type { NotificationPreference } from "@/types/notification";

export const dynamic = "force-dynamic";

const emptyPreference = (userId = ""): NotificationPreference => ({
  id: "",
  restaurantId: null,
  userId,
  channels: {
    inApp: true,
    email: false,
    sms: false,
    push: false,
    whatsapp: false,
  },
  categories: { ...DEFAULT_CATEGORY_PREFERENCES },
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default async function NotificationPreferencesPage() {
  const result = await getNotificationPreferences();

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <NotificationPreferencesView
      preference={result.success ? result.data : emptyPreference()}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
