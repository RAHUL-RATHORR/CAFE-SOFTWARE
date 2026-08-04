"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/auth";
import { canAccess, canAccessRoute, canAccessPathResource } from "@/lib/rbac";
import type { RbacContext, RbacResource } from "@/types/rbac";

export function useCanAccess(
  target: RbacResource | string,
  context?: RbacContext
) {
  const { user, isLoading } = useCurrentUser();
  const role = user?.role;

  const allowed = useMemo(() => {
    if (!role) return false;
    if (target.startsWith("/")) {
      return canAccessPathResource(role, target, context);
    }
    if (target.includes(".")) {
      return canAccessRoute(role, target, context);
    }
    return canAccess(role, target as RbacResource, context);
  }, [role, target, context]);

  return {
    allowed,
    isLoading,
    role,
  };
}
