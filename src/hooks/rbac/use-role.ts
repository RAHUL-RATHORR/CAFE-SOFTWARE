"use client";

import { useCurrentUser } from "@/hooks/auth";
import { hasRole } from "@/lib/rbac";
import type { AppRole } from "@/types/navigation";
import { APP_ROLE_LABELS } from "@/config/navigation/roles";

export function useRole() {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const role = user?.role ?? null;

  return {
    role,
    label: role ? APP_ROLE_LABELS[role] : null,
    isLoading,
    isAuthenticated,
    is: (allowed: AppRole | AppRole[]) => hasRole(role ?? undefined, allowed),
  };
}
