/**
 * Multi-tenant architecture types for DineFlow.
 * No backend binding — client-side foundation only.
 */

export type TenantId = string;

export type TenantThemePreference = "light" | "dark" | "system";

export type TenantBranding = {
  logoUrl?: string;
  receiptLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  themePreference: TenantThemePreference;
};

export type TenantAddress = {
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
};

export type TenantBusinessDetails = {
  businessType: string;
  cuisineType?: string;
  taxId?: string;
  registrationNumber?: string;
};

export type TenantContact = {
  email: string;
  phone: string;
};

export type TenantMetadata = {
  description?: string;
  tags?: string[];
  /** Extensible bag for future platform metadata */
  custom?: Record<string, string | number | boolean | null>;
};

export type TenantSettingsPlaceholder = {
  /** Future: receipt, tax, service charge, etc. */
  enableTips?: boolean;
  enableOnlineOrdering?: boolean;
  defaultOrderType?: "dine-in" | "takeaway" | "delivery";
};

export type TenantConfig = {
  currency: string;
  timezone: string;
  locale?: string;
  branding: TenantBranding;
  settings: TenantSettingsPlaceholder;
  /** Future: feature flags scoped to tenant */
  featureFlags?: Record<string, boolean>;
};

/**
 * Canonical tenant (restaurant) representation for client context.
 */
export type Tenant = {
  id: TenantId;
  name: string;
  slug: string;
  contact: TenantContact;
  address: TenantAddress;
  business: TenantBusinessDetails;
  metadata: TenantMetadata;
  config: TenantConfig;
  /** Future multi-branch support */
  branchIds?: string[];
  activeBranchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TenantIsolationContext = {
  restaurantId: TenantId | null;
  branchId?: string | null;
};

export type TenantSwitcherOption = {
  id: TenantId;
  name: string;
  slug: string;
  isActive?: boolean;
};

export type TenantContextValue = {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  config: TenantConfig | null;
  currency: string | null;
  timezone: string | null;
  theme: TenantBranding | null;
  isolation: TenantIsolationContext;
  isReady: boolean;
  switchTenant: (tenantId: TenantId) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  updateTenantConfig: (partial: Partial<TenantConfig>) => void;
  clearTenant: () => void;
};
