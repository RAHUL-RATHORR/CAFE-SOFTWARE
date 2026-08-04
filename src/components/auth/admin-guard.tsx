"use client";

import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/role-guard";

type AdminGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Super Admin area guard.
 * Requires the `super-admin` role.
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  return (
    <RoleGuard roles={["super-admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
