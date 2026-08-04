import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import { kitchenFailure } from "@/lib/kitchen";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import type { KitchenActionResult } from "@/types/kitchen";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type KitchenActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
};

export async function resolveKitchenActor(
  permission: PermissionKey | PermissionKey[]
): Promise<KitchenActionResult<KitchenActor>> {
  const session = await auth();
  if (!session?.user) {
    return kitchenFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission, { mode: "any" })) {
    return kitchenFailure(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return kitchenFailure(
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
