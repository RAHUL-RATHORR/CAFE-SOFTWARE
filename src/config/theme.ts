/**
 * Theme token configuration for DineFlow.
 * CSS variables in `globals.css` remain the runtime source of truth;
 * this module provides typed access for future theming utilities.
 */
export const themeConfig = {
  defaultMode: "system" as const,
  modes: ["light", "dark", "system"] as const,
  colors: {
    primary: "#2563EB",
    secondary: "#F1F5F9",
    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#DC2626",
    background: "#F8FAFC",
    foreground: "#0F172A",
    card: "#FFFFFF",
    cardForeground: "#0F172A",
    border: "#E2E8F0",
    muted: "#F1F5F9",
    mutedForeground: "#64748B",
  },
  radius: {
    base: "0.75rem",
    preferred: "xl" as const,
  },
  fonts: {
    sans: "var(--font-sans)",
    mono: "var(--font-geist-mono)",
    heading: "var(--font-heading)",
  },
} as const;

export type ThemeMode = (typeof themeConfig.modes)[number];
export type ThemeConfig = typeof themeConfig;
