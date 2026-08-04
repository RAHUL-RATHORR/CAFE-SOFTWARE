import { canAccessRoute, filterNavItemsByRole } from "@/lib/rbac/navigation";
import {
  canAccess,
  canDelete,
  canEdit,
  canView,
  hasPermission,
} from "@/lib/rbac/helpers";
import type { NavItem } from "@/types/navigation";
import type { AppRole } from "@/types/navigation";
import type {
  PermissionKey,
  RbacContext,
  RbacResource,
  VisibilityTarget,
} from "@/types/rbac";

type VisibilityInput = {
  role: AppRole | null | undefined;
  target: VisibilityTarget;
  resource?: RbacResource;
  permission?: PermissionKey | PermissionKey[];
  path?: string;
  context?: RbacContext;
};

/**
 * Generic visibility helper for routes, menus, features, and buttons.
 * Ready for UI wiring — does not change existing components by itself.
 */
export function isVisible(input: VisibilityInput): boolean {
  const { role, target, resource, permission, path, context } = input;

  if (permission) {
    return hasPermission(role, permission, { context });
  }

  if (path) {
    return canAccessRoute(role, path, context);
  }

  if (resource) {
    if (target === "button") {
      return canEdit(role, resource, context) || canDelete(role, resource, context);
    }
    return (
      canView(role, resource, context) || canAccess(role, resource, context)
    );
  }

  return Boolean(role);
}

export function getSidebarVisibility(
  items: NavItem[],
  role: AppRole | null | undefined,
  context?: RbacContext
): NavItem[] {
  return filterNavItemsByRole(items, role, context);
}

export function getMenuVisibility(
  items: NavItem[],
  role: AppRole | null | undefined,
  context?: RbacContext
): NavItem[] {
  return filterNavItemsByRole(items, role, context);
}

export function getFeatureVisibility(
  role: AppRole | null | undefined,
  permission: PermissionKey | PermissionKey[],
  context?: RbacContext
): boolean {
  return isVisible({
    role,
    target: "feature",
    permission,
    context,
  });
}

export function getButtonVisibility(
  role: AppRole | null | undefined,
  resource: RbacResource,
  context?: RbacContext
): boolean {
  return isVisible({
    role,
    target: "button",
    resource,
    context,
  });
}

export function getPageVisibility(
  role: AppRole | null | undefined,
  path: string,
  context?: RbacContext
): boolean {
  return isVisible({
    role,
    target: "page",
    path,
    context,
  });
}
