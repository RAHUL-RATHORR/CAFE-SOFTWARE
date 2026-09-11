import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId, notDeletedFilter, toObjectId } from "@/lib/database";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import { EmployeeModel } from "@/models/staff";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type InventoryActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
  branchId: string | null;
  canSwitchBranch: boolean;
};

export type InventoryActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: string; fieldErrors?: Record<string, string[]> };

export function inventorySuccess<T>(data: T, message?: string): InventoryActionResult<T> {
  return { success: true, data, message };
}

export function inventoryFailure(error: string, code?: string, fieldErrors?: Record<string, string[]>): InventoryActionResult<never> {
  return { success: false, error, code, fieldErrors };
}

export async function resolveInventoryActor(
  permission: PermissionKey | PermissionKey[],
  requestedBranchId?: string | null
): Promise<InventoryActionResult<InventoryActor>> {
  const session = await auth();
  if (!session?.user) {
    return inventoryFailure("You must be signed in.", "UNAUTHORIZED");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission, { mode: "any" })) {
    return inventoryFailure(
      "You do not have permission to perform this action.",
      "FORBIDDEN"
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return inventoryFailure(
      "No restaurant is bound to your account.",
      "NO_RESTAURANT"
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
      // Non-fatal fallback
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
