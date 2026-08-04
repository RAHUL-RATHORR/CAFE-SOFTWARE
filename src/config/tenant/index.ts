import type { TenantConfig } from "@/types/tenant";

export const TENANT_STORAGE_KEY = "dineflow-tenant";

export const DEFAULT_TENANT_BRANDING = {
  primaryColor: "#2563EB",
  secondaryColor: "#F1F5F9",
  themePreference: "system" as const,
};

export const DEFAULT_TENANT_SETTINGS = {
  enableTips: true,
  enableOnlineOrdering: false,
  defaultOrderType: "dine-in" as const,
};

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  currency: "INR",
  timezone: "Asia/Kolkata",
  locale: "en-IN",
  branding: { ...DEFAULT_TENANT_BRANDING },
  settings: { ...DEFAULT_TENANT_SETTINGS },
  featureFlags: {},
};

/**
 * Tenant architecture defaults and future-extension hooks.
 */
export const tenantConfig = {
  storageKey: TENANT_STORAGE_KEY,
  defaults: DEFAULT_TENANT_CONFIG,
  /** Future: branch-level permissions & isolation */
  supportBranches: true,
  /** Future: custom roles per tenant */
  supportCustomRoles: true,
  /** Future: subscription plan gates */
  supportSubscriptionGates: true,
  /** Future: tenant-scoped feature flags */
  supportFeatureFlags: true,
} as const;

export type TenantArchitectureConfig = typeof tenantConfig;
