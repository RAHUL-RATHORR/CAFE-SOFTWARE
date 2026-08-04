"use client";

import type { ReactNode } from "react";
import { useAuthSession, useCurrentUser } from "@/hooks/auth";
import { hasPermission, hasRole } from "@/lib/rbac";
import type { AppRole } from "@/types/auth";
import { AuthError } from "@/components/auth/auth-error";

type RoleGuardProps = {
  children: ReactNode;
  roles?: AppRole[];
  /** Optional permission keys — enforced via RBAC when provided */
  permissions?: string[];
  fallback?: ReactNode;
};

/**
 * Auth RoleGuard — now backed by the RBAC foundation.
 * When roles/permissions are omitted, any authenticated user is allowed.
 */
export function RoleGuard({
  children,
  roles,
  permissions,
  fallback,
}: RoleGuardProps) {
  const { isLoading, isAuthenticated } = useAuthSession();
  const { user } = useCurrentUser();

  if (isLoading) {
    return fallback ?? null;
  }

  if (!isAuthenticated || !user) {
    return fallback ?? <AuthError code="unauthorized" />;
  }

  if (roles?.length && !hasRole(user.role, roles)) {
    return fallback ?? <AuthError code="forbidden" />;
  }

  if (
    permissions?.length &&
    !hasPermission(user.role, permissions, { mode: "any" })
  ) {
    return fallback ?? <AuthError code="forbidden" />;
  }

  return <>{children}</>;
}
