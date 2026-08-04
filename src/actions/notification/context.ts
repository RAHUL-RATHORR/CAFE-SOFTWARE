import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import {
  notificationFailure,
} from "@/lib/notification";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import type { NotificationActionResult } from "@/types/notification";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type NotificationActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
  email?: string | null;
  name?: string | null;
};

export async function resolveNotificationActor(
  permission: PermissionKey | PermissionKey[]
): Promise<NotificationActionResult<NotificationActor>> {
  const session = await auth();
  if (!session?.user) {
    return notificationFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission, { mode: "any" })) {
    return notificationFailure(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return notificationFailure(
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
      email: session.user.email,
      name: session.user.name,
    },
  };
}
