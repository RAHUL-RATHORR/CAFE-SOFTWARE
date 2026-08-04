"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/hooks/auth";
import { AUTH_ROUTES } from "@/lib/auth/constants";
import type { AppRole } from "@/types/auth";

type AuthGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  /** Role placeholder — not enforced yet */
  roles?: AppRole[];
  /** Permission placeholder — not enforced yet */
  permissions?: string[];
};

function DefaultFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Checking session</span>
    </div>
  );
}

/**
 * Client-side protected route guard. Middleware is the primary gate;
 * this adds defense-in-depth for client islands.
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = AUTH_ROUTES.login,
  roles,
  permissions,
}: AuthGuardProps) {
  void roles;
  void permissions;
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  if (isLoading) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  // Role/permission placeholders intentionally unused
  return <>{children}</>;
}
