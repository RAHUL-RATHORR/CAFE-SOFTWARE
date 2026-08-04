"use client";

import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/role-guard";

type RestaurantGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Restaurant-scoped guard placeholder.
 * Requires authentication today; tenant binding enforcement is future work.
 */
export function RestaurantGuard({
  children,
  fallback,
}: RestaurantGuardProps) {
  return (
    <RoleGuard
      roles={[
        "restaurant-owner",
        "manager",
        "cashier",
        "chef",
        "waiter",
      ]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}
