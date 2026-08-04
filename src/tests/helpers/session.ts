import { createTestRestaurant } from "@/tests/fixtures";
import type { AppRole } from "@/types/navigation";
import { createTestUser, testIds } from "@/tests/fixtures";
import type { Session } from "next-auth";

export function mockSession(
  overrides: Partial<{
    id: string;
    email: string;
    name: string;
    role: AppRole;
    restaurantId: string | null;
    rememberMe?: boolean;
  }> = {}
): Session {
  const user = createTestUser(overrides);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId,
      image: user.image ?? undefined,
    },
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    rememberMe: overrides.rememberMe ?? false,
  } as Session;
}

export function mockPermissions(role: AppRole = "manager") {
  return {
    role,
    restaurantId: testIds.restaurantId,
    canManageOrders: ["manager", "restaurant-owner", "cashier"].includes(role),
    canManageKitchen: ["manager", "restaurant-owner", "chef"].includes(role),
    canManageBilling: ["manager", "restaurant-owner", "cashier"].includes(role),
    canAccessAdmin: role === "super-admin",
  };
}

export function mockRestaurant(
  overrides: Parameters<typeof createTestRestaurant>[0] = {}
) {
  return createTestRestaurant(overrides);
}
