"use client";

import { useTenantContext } from "@/providers/tenant";

/** Full tenant context for the active restaurant workspace. */
export function useTenant() {
  return useTenantContext();
}

/** Current restaurant tenant (or null). */
export function useCurrentRestaurant() {
  const { currentTenant, isReady } = useTenantContext();
  return { restaurant: currentTenant, isReady };
}

/** Tenant currency / timezone / theme helpers. */
export function useTenantRegional() {
  const { currency, timezone, theme, config } = useTenantContext();
  return { currency, timezone, theme, config };
}
