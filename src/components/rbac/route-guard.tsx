"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/auth";
import { canAccessRoute } from "@/lib/rbac";
import { AuthError } from "@/components/auth/auth-error";
import type { RbacContext } from "@/types/rbac";

type RouteGuardProps = {
  children: ReactNode;
  /** Defaults to current pathname */
  path?: string;
  context?: RbacContext;
  fallback?: ReactNode;
};

/**
 * Route-level authorization guard using route permission bindings.
 */
export function RouteGuard({
  children,
  path,
  context,
  fallback,
}: RouteGuardProps) {
  const pathname = usePathname();
  const target = path ?? pathname;
  const { user, isLoading, isAuthenticated } = useCurrentUser();

  if (isLoading) {
    return fallback ?? null;
  }

  if (!isAuthenticated || !user) {
    return fallback ?? <AuthError code="unauthorized" />;
  }

  if (!canAccessRoute(user.role, target, context)) {
    return fallback ?? <AuthError code="forbidden" />;
  }

  return <>{children}</>;
}
