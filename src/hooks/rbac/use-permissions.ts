"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/auth";
import {
  listPermissionsForRole,
  resolveRolePermissions,
} from "@/lib/rbac";
import type { PermissionKey, RbacContext } from "@/types/rbac";

export function usePermissions(context?: RbacContext) {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const role = user?.role;

  const permissions = useMemo(() => {
    if (!role) return [] as PermissionKey[];
    return listPermissionsForRole(role);
  }, [role]);

  const permissionSet = useMemo(
    () => resolveRolePermissions(role, context),
    [role, context]
  );

  return {
    role,
    permissions,
    permissionSet,
    isLoading,
    isAuthenticated,
    restaurantId: user?.restaurantId ?? context?.restaurantId ?? null,
  };
}
