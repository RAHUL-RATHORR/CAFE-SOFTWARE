import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId, notDeletedFilter, toObjectId } from "@/lib/database";
import { kitchenFailure } from "@/lib/kitchen";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import { EmployeeModel } from "@/models/staff";
import type { KitchenActionResult } from "@/types/kitchen";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type KitchenActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
  branchId: string | null;
  canSwitchBranch: boolean;
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

  // Branch resolution: super-admin, restaurant-owner, and manager have multi-branch access
  const isMultiBranchRole =
    role === "super-admin" ||
    role === "restaurant-owner" ||
    role === "manager";

  let branchId: string | null = null;
  if (!isMultiBranchRole && session.user.id && isValidObjectId(session.user.id)) {
    try {
      const emp = await EmployeeModel.findOne(
        notDeletedFilter({
          restaurantId: toObjectId(restaurantId),
          userId: toObjectId(session.user.id),
        }) as Record<string, unknown>
      )
        .select({ branchId: 1 })
        .lean()
        .exec();

      if (emp?.branchId) {
        branchId = String(emp.branchId);
      }
    } catch {
      // Non-fatal fallback
    }
  }

  return {
    success: true,
    data: {
      userId: session.user.id,
      role,
      restaurantId,
      branchId,
      canSwitchBranch: isMultiBranchRole && !branchId,
    },
  };
}
