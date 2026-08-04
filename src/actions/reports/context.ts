import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import { reportFailure } from "@/lib/reports";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import type { ReportActionResult } from "@/types/report";
import type { PermissionKey } from "@/types/rbac";
import type { AppRole } from "@/types/navigation";

export type ReportActor = {
  userId: string;
  role: AppRole;
  restaurantId: string;
};

export async function resolveReportActor(
  permission: PermissionKey | PermissionKey[]
): Promise<ReportActionResult<ReportActor>> {
  const session = await auth();
  if (!session?.user) {
    return reportFailure("UNAUTHORIZED", "You must be signed in.");
  }

  const role = session.user.role;
  if (!hasPermission(role, permission, { mode: "any" })) {
    return reportFailure(
      "FORBIDDEN",
      "You do not have permission to view reports."
    );
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return reportFailure(
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
