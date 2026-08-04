/**
 * DineFlow design tokens — single source of truth for the design system.
 * CSS variables in globals.css remain the runtime theme bridge.
 */

export const colorTokens = {
  primary: "#2563EB",
  secondary: "#F1F5F9",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#0EA5E9",
  neutral: "#64748B",
  background: "#F8FAFC",
  foreground: "#0F172A",
  surface: "#FFFFFF",
  muted: "#F1F5F9",
  mutedForeground: "#64748B",
  border: "#E2E8F0",
  ring: "#2563EB",
} as const;

export const typographyScale = {
  xs: { size: "0.75rem", lineHeight: "1rem" },
  sm: { size: "0.875rem", lineHeight: "1.25rem" },
  base: { size: "1rem", lineHeight: "1.5rem" },
  lg: { size: "1.125rem", lineHeight: "1.75rem" },
  xl: { size: "1.25rem", lineHeight: "1.75rem" },
  "2xl": { size: "1.5rem", lineHeight: "2rem" },
  "3xl": { size: "1.875rem", lineHeight: "2.25rem" },
  "4xl": { size: "2.25rem", lineHeight: "2.5rem" },
} as const;

export const spacingScale = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const radiusScale = {
  none: "0",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px",
} as const;

export const shadowScale = {
  none: "none",
  sm: "0 1px 2px 0 rgb(15 23 42 / 0.05)",
  md: "0 4px 6px -1px rgb(15 23 42 / 0.08)",
  lg: "0 10px 15px -3px rgb(15 23 42 / 0.1)",
  xl: "0 20px 25px -5px rgb(15 23 42 / 0.12)",
} as const;

export const opacityScale = {
  0: "0",
  5: "0.05",
  10: "0.1",
  20: "0.2",
  40: "0.4",
  50: "0.5",
  60: "0.6",
  80: "0.8",
  100: "1",
} as const;

export const zIndexScale = {
  base: 0,
  dropdown: 40,
  sticky: 30,
  overlay: 50,
  modal: 50,
  toast: 60,
  search: 70,
  max: 9999,
} as const;

export const animationDurations = {
  instant: "0ms",
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const;

export const transitionCurves = {
  linear: "linear",
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  spring: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const containerWidths = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
  full: "100%",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const designTokens = {
  colors: colorTokens,
  typography: typographyScale,
  spacing: spacingScale,
  radius: radiusScale,
  shadow: shadowScale,
  opacity: opacityScale,
  zIndex: zIndexScale,
  animation: animationDurations,
  easing: transitionCurves,
  container: containerWidths,
  breakpoints,
} as const;

export type DesignTokens = typeof designTokens;
