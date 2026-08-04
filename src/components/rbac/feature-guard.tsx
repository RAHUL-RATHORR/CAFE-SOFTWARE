"use client";

import type { ReactNode } from "react";
import { useHasPermission } from "@/hooks/rbac";
import { futureRbacSupport } from "@/lib/rbac";
import { AuthError } from "@/components/auth/auth-error";
import type { PermissionKey, RbacContext } from "@/types/rbac";

type FeatureGuardProps = {
  children: ReactNode;
  /** Feature permission key(s) required to render */
  permission?: PermissionKey | PermissionKey[] | string | string[];
  /** Future feature flag id */
  featureFlag?: string;
  context?: RbacContext;
  fallback?: ReactNode;
};

/**
 * Feature visibility guard — permissions now; feature flags later.
 */
export function FeatureGuard({
  children,
  permission,
  featureFlag,
  context,
  fallback,
}: FeatureGuardProps) {
  const { allowed, isLoading } = useHasPermission(permission ?? [], {
    context,
  });

  if (isLoading) {
    return fallback ?? null;
  }

  if (featureFlag && futureRbacSupport.featureFlagsEnabled) {
    const enabled = context?.featureFlags?.[featureFlag] ?? false;
    if (!enabled) {
      return fallback ?? null;
    }
  }

  if (permission && !allowed) {
    return fallback ?? <AuthError code="forbidden" />;
  }

  return <>{children}</>;
}
