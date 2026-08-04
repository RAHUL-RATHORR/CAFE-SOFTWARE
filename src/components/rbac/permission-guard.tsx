"use client";

import type { ReactNode } from "react";
import { useHasPermission } from "@/hooks/rbac";
import { AuthError } from "@/components/auth/auth-error";
import type { PermissionKey, RbacContext } from "@/types/rbac";

type PermissionGuardProps = {
  children: ReactNode;
  permission: PermissionKey | PermissionKey[] | string | string[];
  mode?: "any" | "all";
  context?: RbacContext;
  fallback?: ReactNode;
};

export function PermissionGuard({
  children,
  permission,
  mode = "any",
  context,
  fallback,
}: PermissionGuardProps) {
  const { allowed, isLoading } = useHasPermission(permission, { mode, context });

  if (isLoading) {
    return fallback ?? null;
  }

  if (!allowed) {
    return fallback ?? <AuthError code="forbidden" />;
  }

  return <>{children}</>;
}
