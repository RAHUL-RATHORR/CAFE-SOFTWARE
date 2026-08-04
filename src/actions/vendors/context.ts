import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import { vendorFailure } from "@/lib/vendors";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import type { VendorActionResult } from "@/types/vendor";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type VendorActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
};

export async function resolveVendorActor(
  permission: PermissionKey | PermissionKey[]
): Promise<VendorActionResult<VendorActor>> {
  const session = await auth();
  if (!session?.user) {
    return vendorFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission, { mode: "any" })) {
    return vendorFailure(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return vendorFailure(
      "NO_RESTAURANT",
      "No restaurant is bound to your account."
    );
  }

  return {
    success: true,
    data: {
      userId: session.user.id,
      role,
      restaurantId,
    },
  };
}
