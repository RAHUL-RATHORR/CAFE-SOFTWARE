import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId, notDeletedFilter, toObjectId } from "@/lib/database";
import { billingFailure } from "@/lib/billing";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import { EmployeeModel } from "@/models/staff";
import type { BillingActionResult } from "@/types/billing";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type BillingActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
  branchId: string | null;
  canSwitchBranch: boolean;
};

export async function resolveBillingActor(
  permission: PermissionKey | PermissionKey[],
  requestedBranchId?: string | null
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
      // fallback
    }
  }

  if (isMultiBranchRole && requestedBranchId && isValidObjectId(requestedBranchId)) {
    branchId = requestedBranchId;
  }

  return {
    success: true,
    data: {
      userId: session.user.id,
      role,
      restaurantId,
      branchId,
      canSwitchBranch: isMultiBranchRole,
    },
  };
}
