export { tenantConfig, DEFAULT_TENANT_CONFIG } from "@/config/tenant";
export {
  createIsolationContext,
  assertTenantMatch,
  tenantScopeFilter,
  futureTenantSupport,
  toSwitcherOptions,
} from "@/lib/tenant";
export { useTenant, useCurrentRestaurant, useTenantRegional } from "@/hooks/tenant";
export { TenantProvider, useTenantContext } from "@/providers/tenant";
export { RestaurantSwitcherPlaceholder } from "@/components/tenant";
export type {
  Tenant,
  TenantConfig,
  TenantContextValue,
  TenantIsolationContext,
} from "@/types/tenant";
