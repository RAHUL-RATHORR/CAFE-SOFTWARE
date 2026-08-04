"use client";

import type { ReactNode } from "react";
import { useRole } from "@/hooks/rbac";
import { AuthError } from "@/components/auth/auth-error";
import type { AppRole } from "@/types/navigation";

type RoleGuardProps = {
  children: ReactNode;
  roles: AppRole | AppRole[];
  fallback?: ReactNode;
};

/**
 * RBAC role guard — enforces role membership when roles are provided.
 */
export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { is, isLoading, isAuthenticated } = useRole();

  if (isLoading) {
    return fallback ?? null;
  }

  if (!isAuthenticated) {
    return fallback ?? <AuthError code="unauthorized" />;
  }

  if (!is(roles)) {
    return fallback ?? <AuthError code="forbidden" />;
  }

  return <>{children}</>;
}
