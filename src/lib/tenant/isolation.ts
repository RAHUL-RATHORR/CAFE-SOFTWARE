import type { TenantIsolationContext, TenantId } from "@/types/tenant";

/**
 * Tenant isolation helpers — architecture only.
 * Wire to queries/APIs in future modules.
 */

export function createIsolationContext(
  restaurantId: TenantId | null,
  branchId?: string | null
): TenantIsolationContext {
  return {
    restaurantId,
    branchId: branchId ?? null,
  };
}

/** Ensure an entity belongs to the active restaurant tenant. */
export function assertTenantMatch(
  entityRestaurantId: string | null | undefined,
  isolation: TenantIsolationContext
): boolean {
  if (!isolation.restaurantId) return false;
  if (!entityRestaurantId) return false;
  return entityRestaurantId === isolation.restaurantId;
}

/** Future: branch-scoped isolation check. */
export function assertBranchMatch(
  entityBranchId: string | null | undefined,
  isolation: TenantIsolationContext
): boolean {
  if (!isolation.branchId) return true;
  if (!entityBranchId) return false;
  return entityBranchId === isolation.branchId;
}

/** Scope filter placeholder for future data-layer queries. */
export function tenantScopeFilter(isolation: TenantIsolationContext) {
  return {
    restaurantId: isolation.restaurantId,
    ...(isolation.branchId ? { branchId: isolation.branchId } : {}),
  };
}
