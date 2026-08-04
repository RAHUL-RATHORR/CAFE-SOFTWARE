import type { ReactNode } from "react";
import { AdminGuard } from "@/components/auth/admin-guard";
import { AuthError } from "@/components/auth/auth-error";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard fallback={<AuthError code="forbidden" />}>
      {children}
    </AdminGuard>
  );
}
