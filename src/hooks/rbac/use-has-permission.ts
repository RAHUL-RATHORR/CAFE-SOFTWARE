"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/auth";
import { hasPermission } from "@/lib/rbac";
import type { PermissionKey, RbacContext } from "@/types/rbac";

export function useHasPermission(
  permission: PermissionKey | PermissionKey[] | string | string[],
  options?: { mode?: "any" | "all"; context?: RbacContext }
) {
  const { user, isLoading } = useCurrentUser();
  const role = user?.role;

  const allowed = useMemo(
    () => hasPermission(role, permission, options),
    [role, permission, options]
  );

  return {
    allowed,
    isLoading,
    role,
  };
}
