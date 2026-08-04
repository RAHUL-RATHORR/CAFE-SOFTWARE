import {
  getPermission,
  getRolePermissionKeys,
  isRegisteredPermission,
  permissionList,
  rolePermissions,
} from "@/config/permissions";
import type {
  PermissionKey,
  RbacAction,
  RbacContext,
  RbacResource,
  RbacRole,
} from "@/types/rbac";
import type { AppRole } from "@/types/navigation";
import type { PermissionPlaceholder } from "@/types/navigation";

function normalizePermissions(
  input: PermissionKey | PermissionKey[] | string | string[] | PermissionPlaceholder
): string[] {
  if (typeof input === "string") return [input];
  if (Array.isArray(input)) return input.map(String);
  if (input && typeof input === "object" && "permissions" in input) {
    return (input.permissions ?? []).map(String);
  }
  return [];
}

export function resolveRolePermissions(
  role: RbacRole | AppRole | null | undefined,
  context?: RbacContext
): Set<string> {
  const granted = new Set<string>();

  if (!role) {
    for (const key of context?.customPermissions ?? []) {
      granted.add(key);
    }
    return granted;
  }

  const mapped = getRolePermissionKeys(role as RbacRole);
  if ((mapped as readonly string[])[0] === "*") {
    for (const permission of permissionList) {
      granted.add(permission.key);
    }
  } else {
    for (const key of mapped as readonly PermissionKey[]) {
      granted.add(key);
    }
  }

  for (const key of context?.customPermissions ?? []) {
    granted.add(key);
  }

  return granted;
}

export function hasRole(
  userRole: RbacRole | AppRole | null | undefined,
  allowed: RbacRole | AppRole | Array<RbacRole | AppRole>
): boolean {
  if (!userRole) return false;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.includes(userRole);
}

export function hasPermission(
  role: RbacRole | AppRole | null | undefined,
  permission:
    | PermissionKey
    | PermissionKey[]
    | string
    | string[]
    | PermissionPlaceholder,
  options?: { mode?: "any" | "all"; context?: RbacContext }
): boolean {
  const required = normalizePermissions(permission);
  if (required.length === 0) {
    // Object-shaped PermissionPlaceholder with only roles
    if (
      permission &&
      typeof permission === "object" &&
      !Array.isArray(permission) &&
      "roles" in permission &&
      permission.roles?.length
    ) {
      return hasRole(role, permission.roles);
    }
    return Boolean(role);
  }

  const mode =
    options?.mode ??
    (typeof permission === "object" &&
    !Array.isArray(permission) &&
    "mode" in permission
      ? permission.mode
      : "any") ??
    "any";

  const granted = resolveRolePermissions(role, options?.context);

  if (mode === "all") {
    return required.every((key) => granted.has(key));
  }

  return required.some((key) => granted.has(key));
}

export function canAccess(
  role: RbacRole | AppRole | null | undefined,
  resource: RbacResource,
  context?: RbacContext
): boolean {
  return (
    hasPermission(role, `${resource}.access`, { context }) ||
    hasPermission(role, `${resource}.view`, { context }) ||
    hasPermission(role, `${resource}.manage`, { context })
  );
}

export function canPerform(
  role: RbacRole | AppRole | null | undefined,
  resource: RbacResource,
  action: RbacAction,
  context?: RbacContext
): boolean {
  const key = `${resource}.${action}`;
  if (isRegisteredPermission(key)) {
    return hasPermission(role, key, { context });
  }
  return hasPermission(role, `${resource}.manage`, { context });
}

export function canView(
  role: RbacRole | AppRole | null | undefined,
  resource: RbacResource,
  context?: RbacContext
) {
  return canPerform(role, resource, "view", context);
}

export function canCreate(
  role: RbacRole | AppRole | null | undefined,
  resource: RbacResource,
  context?: RbacContext
) {
  return canPerform(role, resource, "create", context);
}

export function canEdit(
  role: RbacRole | AppRole | null | undefined,
  resource: RbacResource,
  context?: RbacContext
) {
  return canPerform(role, resource, "edit", context);
}

export function canDelete(
  role: RbacRole | AppRole | null | undefined,
  resource: RbacResource,
  context?: RbacContext
) {
  return canPerform(role, resource, "delete", context);
}

export function listPermissionsForRole(
  role: RbacRole | AppRole
): PermissionKey[] {
  const mapped = rolePermissions[role as RbacRole];
  if (!mapped) return [];
  if ((mapped as readonly string[])[0] === "*") {
    return permissionList.map((item) => item.key);
  }
  return [...(mapped as readonly PermissionKey[])];
}

export function getPermissionMeta(key: string) {
  return getPermission(key);
}
