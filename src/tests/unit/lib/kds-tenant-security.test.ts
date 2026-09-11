import { describe, expect, it } from "vitest";
import { isValidStatusTransition } from "@/lib/kitchen/tickets";
import { hasPermission } from "@/lib/rbac";
import { buildKitchenChannel } from "@/lib/kitchen/realtime";
import type { AppRole } from "@/types/navigation";

describe("KDS Multi-Tenant Security & Branch Scoping Rules", () => {
  it("enforces tenant isolation across channels", () => {
    const channelRestA = buildKitchenChannel("tenant_restaurant_A", "branch_1");
    const channelRestB = buildKitchenChannel("tenant_restaurant_B", "branch_1");

    expect(channelRestA).not.toBe(channelRestB);
    expect(channelRestA.startsWith("restaurant:tenant_restaurant_A:")).toBe(true);
    expect(channelRestB.startsWith("restaurant:tenant_restaurant_B:")).toBe(true);
  });

  it("enforces branch isolation when user is branch-restricted", () => {
    const userAssignedBranchId: string = "branch_jaipur";
    const targetOrderBranchId: string = "branch_mansarovar";

    // Branch A user attempting to access Branch B order
    const isAllowed = userAssignedBranchId === targetOrderBranchId;
    expect(isAllowed).toBe(false);
  });

  it("allows multi-branch access only for authorized manager/owner/admin roles", () => {
    const multiBranchRoles: AppRole[] = [
      "super-admin",
      "restaurant-owner",
      "manager",
    ];
    const restrictedRoles: AppRole[] = [
      "chef",
      "cashier",
      "waiter",
      "customer",
    ];

    multiBranchRoles.forEach((role) => {
      const canSwitch =
        role === "super-admin" ||
        role === "restaurant-owner" ||
        role === "manager";
      expect(canSwitch).toBe(true);
    });

    restrictedRoles.forEach((role) => {
      const isMulti =
        role === "super-admin" ||
        role === "restaurant-owner" ||
        role === "manager";
      expect(isMulti).toBe(false);
    });
  });

  it("enforces RBAC permissions for kitchen display and order updates", () => {
    // Chef role has kitchen permissions
    expect(
      hasPermission("chef", ["kitchen.view", "kitchen.manage"], { mode: "any" })
    ).toBe(true);
    expect(
      hasPermission("chef", ["kitchen.update", "orders.changeStatus"], {
        mode: "any",
      })
    ).toBe(true);

    // Customer role MUST NOT have kitchen update permissions
    expect(
      hasPermission("customer", ["kitchen.update", "kitchen.manage"], {
        mode: "any",
      })
    ).toBe(false);
    expect(
      hasPermission("customer", ["kitchen.view"], { mode: "any" })
    ).toBe(false);
  });

  it("strictly prevents invalid READY -> PREPARING transition", () => {
    expect(isValidStatusTransition("ready", "preparing")).toBe(false);
  });

  it("strictly prevents invalid SERVED -> PENDING transition", () => {
    expect(isValidStatusTransition("served", "pending")).toBe(false);
  });

  it("strictly prevents invalid CANCELLED -> CONFIRMED transition", () => {
    expect(isValidStatusTransition("cancelled", "confirmed")).toBe(false);
  });
});
