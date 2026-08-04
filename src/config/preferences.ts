import type { UserPreferences } from "@/types";

export const THEME_STORAGE_KEY = "dineflow-theme";
export const PREFERENCES_STORAGE_KEY = "dineflow-preferences";

export const defaultPreferences: UserPreferences = {
  language: "en-US",
  currency: "USD",
  timezone: "America/Los_Angeles",
  dateFormat: "MMM d, yyyy",
  timeFormat: "12h",
  compactMode: false,
  sidebarDefaultCollapsed: false,
  animationsEnabled: true,
  reducedMotion: false,
  dashboardDensity: "comfortable",
  tableDensity: "comfortable",
  notificationSound: false,
};

export const preferenceOptions = {
  languages: [
    { label: "English (US)", value: "en-US" },
    { label: "English (UK)", value: "en-GB" },
    { label: "Spanish", value: "es-ES" },
    { label: "French", value: "fr-FR" },
  ],
  currencies: [
    { label: "USD — US Dollar", value: "USD" },
    { label: "EUR — Euro", value: "EUR" },
    { label: "GBP — British Pound", value: "GBP" },
    { label: "INR — Indian Rupee", value: "INR" },
  ],
  timezones: [
    { label: "Pacific Time (PT)", value: "America/Los_Angeles" },
    { label: "Eastern Time (ET)", value: "America/New_York" },
    { label: "UTC", value: "UTC" },
    { label: "India Standard Time", value: "Asia/Kolkata" },
  ],
  dateFormats: [
    { label: "MMM d, yyyy", value: "MMM d, yyyy" },
    { label: "dd/MM/yyyy", value: "dd/MM/yyyy" },
    { label: "MM/dd/yyyy", value: "MM/dd/yyyy" },
    { label: "yyyy-MM-dd", value: "yyyy-MM-dd" },
  ],
  densities: [
    { label: "Comfortable", value: "comfortable" },
    { label: "Compact", value: "compact" },
  ],
} as const;
