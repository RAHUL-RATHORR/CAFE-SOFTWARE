import { describe, expect, it } from "vitest";
import {
  createTestRestaurant,
  createTestBranch,
  createTestUser,
  createTestCustomer,
  createTestCategory,
  createTestMenuItem,
  createTestOrder,
  createTestInvoice,
  createTestInventoryItem,
  createTestPurchase,
  createTestEmployee,
} from "@/tests/fixtures";
import {
  createAuthMocks,
  createRepositoryMocks,
  createServerActionMocks,
  createNotificationMocks,
} from "@/tests/mocks";
import { mockPermissions, mockRestaurant, mockSession } from "@/tests/helpers";

describe("test fixtures", () => {
  it("builds domain fixtures with stable ids", () => {
    expect(createTestRestaurant().slug).toBe("dineflow-demo");
    expect(createTestBranch().code).toBe("MAIN");
    expect(createTestUser().role).toBe("manager");
    expect(createTestCustomer().email).toContain("@");
    expect(createTestCategory().name).toBe("Beverages");
    expect(createTestMenuItem().price).toBeGreaterThan(0);
    expect(createTestOrder().items.length).toBeGreaterThan(0);
    expect(createTestInvoice().orderId).toBeTruthy();
    expect(createTestInventoryItem().sku).toBe("TEA-001");
    expect(createTestPurchase().status).toBe("draft");
    expect(createTestEmployee().role).toBe("chef");
  });
});

describe("test helpers and mocks", () => {
  it("creates session and permission helpers", () => {
    const session = mockSession({ role: "cashier" });
    expect(session.user.role).toBe("cashier");
    expect(mockPermissions("super-admin").canAccessAdmin).toBe(true);
    expect(mockRestaurant({ name: "Branch Cafe" }).name).toBe("Branch Cafe");
  });

  it("exposes repository, action, auth, and notification mocks", async () => {
    const repos = createRepositoryMocks();
    const actions = createServerActionMocks();
    const auth = createAuthMocks();
    const notifications = createNotificationMocks();

    expect((await repos.order.findById("x")).id).toBeTruthy();
    expect((await actions.getOrders({})).success).toBe(true);
    expect((await auth.requireAuth()).email).toContain("@");
    expect((await notifications.list()).items).toEqual([]);
  });
});
