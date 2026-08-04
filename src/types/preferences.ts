export type TimeFormat = "12h" | "24h";

export type Density = "comfortable" | "compact";

export type UserPreferences = {
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: TimeFormat;
  compactMode: boolean;
  sidebarDefaultCollapsed: boolean;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  dashboardDensity: Density;
  tableDensity: Density;
  notificationSound: boolean;
};

export type PreferenceSectionId =
  | "appearance"
  | "display"
  | "localization"
  | "accessibility"
  | "dashboard"
  | "future";
