import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import { branchFailure } from "@/lib/branches";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import type { BranchActionResult } from "@/types/branch";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type BranchActor = {
  userId: string;
  userEmail?: string | null;
  role: AppRole;
  restaurantId: string;
};

export async function resolveBranchActor(
  permission: PermissionKey | PermissionKey[]
): Promise<BranchActionResult<BranchActor>> {
  const session = await auth();
  if (!session?.user) {
    return branchFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission, { mode: "any" })) {
    return branchFailure(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return branchFailure(
      "NO_RESTAURANT",
      "No restaurant is bound to your account."
    );
  }

  return {
    success: true,
    data: {
      userId: session.user.id,
      userEmail: session.user.email ?? null,
      role,
      restaurantId,
    },
  };
}
