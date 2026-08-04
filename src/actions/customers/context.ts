import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import { customerFailure } from "@/lib/customers";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import type { CustomerActionResult } from "@/types/customer";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type CustomerActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
};

export async function resolveCustomerActor(
  permission: PermissionKey | PermissionKey[]
): Promise<CustomerActionResult<CustomerActor>> {
  const session = await auth();
  if (!session?.user) {
    return customerFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission, { mode: "any" })) {
    return customerFailure(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return customerFailure(
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
