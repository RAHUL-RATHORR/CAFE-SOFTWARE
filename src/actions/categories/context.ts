import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import { categoryFailure } from "@/lib/categories";
import type { CategoryActionResult } from "@/types/category";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export const DEMO_RESTAURANT_ID = "67a000000000000000000001";

export type CategoryActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
};

export async function resolveCategoryActor(
  permission: PermissionKey
): Promise<CategoryActionResult<CategoryActor>> {
  const session = await auth();
  if (!session?.user) {
    return categoryFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission)) {
    return categoryFailure(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return categoryFailure(
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
