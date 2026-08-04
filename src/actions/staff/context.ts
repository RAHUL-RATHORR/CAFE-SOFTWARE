import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import { staffFailure } from "@/lib/staff";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import type { StaffActionResult } from "@/types/staff";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type StaffActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
};

export async function resolveStaffActor(
  permission: PermissionKey | PermissionKey[]
): Promise<StaffActionResult<StaffActor>> {
  const session = await auth();
  if (!session?.user) {
    return staffFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission, { mode: "any" })) {
    return staffFailure(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return staffFailure(
      "NO_RESTAURANT",
      "No restaurant is bound to your account."
    );
  }

  return {
    success: true,
    data: { userId: session.user.id, role, restaurantId },
  };
}
