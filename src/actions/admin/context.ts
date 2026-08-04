import { auth } from "@/lib/auth/auth";
import { hasPermission, hasRole } from "@/lib/rbac";
import { adminFailure } from "@/lib/admin";
import type { AdminActionResult } from "@/types/admin";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type AdminActor = {
  userId: string;
  role: AppRole;
  email: string;
};

export async function resolveAdminActor(
  permission: PermissionKey | PermissionKey[]
): Promise<AdminActionResult<AdminActor>> {
  const session = await auth();
  if (!session?.user) {
    return adminFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  const isSuperAdmin = hasRole(role, ["super-admin"]);
  const allowed =
    isSuperAdmin ||
    hasPermission(role, permission, { mode: "any" });

  if (!allowed) {
    return adminFailure(
      "FORBIDDEN",
      "Super admin access is required for this action."
    );
  }

  return {
    success: true,
    data: {
      userId: session.user.id,
      role,
      email: session.user.email ?? "",
    },
  };
}
