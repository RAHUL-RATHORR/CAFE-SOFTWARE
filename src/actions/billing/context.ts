import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import { billingFailure } from "@/lib/billing";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import type { BillingActionResult } from "@/types/billing";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type BillingActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
};

export async function resolveBillingActor(
  permission: PermissionKey | PermissionKey[]
): Promise<BillingActionResult<BillingActor>> {
  const session = await auth();
  if (!session?.user) {
    return billingFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission, { mode: "any" })) {
    return billingFailure(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return billingFailure(
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
