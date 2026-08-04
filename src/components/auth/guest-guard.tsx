"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/hooks/auth";
import { DEFAULT_AUTHENTICATED_REDIRECT } from "@/lib/auth/constants";

type GuestGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
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
 * Client-side guest route guard for auth pages.
 */
export function GuestGuard({
  children,
  fallback,
  redirectTo = DEFAULT_AUTHENTICATED_REDIRECT,
}: GuestGuardProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  if (isLoading) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  if (isAuthenticated) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  return <>{children}</>;
}
