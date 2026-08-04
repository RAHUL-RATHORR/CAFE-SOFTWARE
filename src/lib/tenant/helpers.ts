import { DEFAULT_TENANT_CONFIG } from "@/config/tenant";
import type {
  Tenant,
  TenantConfig,
  TenantSwitcherOption,
} from "@/types/tenant";

export function getTenantCurrency(tenant: Tenant | null): string | null {
  return tenant?.config.currency ?? null;
}

export function getTenantTimezone(tenant: Tenant | null): string | null {
  return tenant?.config.timezone ?? null;
}

export function getTenantTheme(tenant: Tenant | null) {
  return tenant?.config.branding ?? null;
}

export function mergeTenantConfig(
  base: TenantConfig | null | undefined,
  partial: Partial<TenantConfig>
): TenantConfig {
  const current = base ?? DEFAULT_TENANT_CONFIG;
  return {
    ...current,
    ...partial,
    branding: {
      ...current.branding,
      ...(partial.branding ?? {}),
    },
    settings: {
      ...current.settings,
      ...(partial.settings ?? {}),
    },
    featureFlags: {
      ...(current.featureFlags ?? {}),
      ...(partial.featureFlags ?? {}),
    },
  };
}

export function toSwitcherOptions(
  tenants: Tenant[],
  activeId?: string | null
): TenantSwitcherOption[] {
  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    isActive: tenant.id === activeId,
  }));
}

/**
 * Future extension hooks documented for enterprise readiness.
 */
export const futureTenantSupport = {
  branches: true,
  customRoles: true,
  customPermissions: true,
  subscriptionRestrictions: true,
  featureFlags: true,
} as const;
