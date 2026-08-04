import {
  hasPermission as rbacHasPermission,
  hasRole as rbacHasRole,
} from "@/lib/rbac";
import type { AppRole, PermissionPlaceholder } from "@/types/navigation";

/**
 * Auth-facing permission helper — delegates to the RBAC foundation.
 * Signature kept for backward compatibility: (permission, role?).
 */
export function hasPermission(
  permission: PermissionPlaceholder | string | string[],
  role?: AppRole
): boolean {
  return rbacHasPermission(role, permission);
}

/**
 * Auth-facing role helper — delegates to the RBAC foundation.
 */
export function hasRole(
  userRole: AppRole | undefined,
  allowed: AppRole | AppRole[]
): boolean {
  return rbacHasRole(userRole, allowed);
}
