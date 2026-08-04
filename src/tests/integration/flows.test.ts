import { describe, expect, it, vi } from "vitest";
import { loginSchema } from "@/lib/validations/auth";
import { createCategorySchema } from "@/lib/validators/category/schemas";
import { orderSuccess, orderFailure } from "@/lib/orders/result";
import { hasPermission, hasRole } from "@/lib/rbac/helpers";
import {
  createAuthMocks,
  createNotificationMocks,
  createRepositoryMocks,
  createServerActionMocks,
} from "@/tests/mocks";
import {
  createTestOrder,
  createTestUser,
  createTestCategory,
  createTestMenuItem,
} from "@/tests/fixtures";
import { getSafeCallbackUrl, getRouteKind } from "@/lib/auth/routing";
import { defaultPreferences } from "@/config/preferences";

describe("authentication flow foundation", () => {
  it("validates credentials and builds a mock session", async () => {
    const parsed = loginSchema.safeParse({
      email: "manager@dineflow.local",
      password: "Demo@12345",
      rememberMe: true,
    });
    expect(parsed.success).toBe(true);

    const auth = createAuthMocks("manager");
    const session = await auth.auth();
    expect(session?.user.role).toBe("manager");
    expect(session?.user.email).toContain("@");
  });

  it("blocks open redirects after login", () => {
    expect(getSafeCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(getSafeCallbackUrl("//phishing.test")).toBe("/dashboard");
  });
});

describe("rbac integration", () => {
  it("gates restaurant vs admin access by role", () => {
    expect(hasRole("manager", ["manager", "cashier"])).toBe(true);
    expect(hasRole("waiter", ["super-admin"])).toBe(false);
    expect(hasPermission("super-admin", "admin.restaurants")).toBe(true);
    expect(getRouteKind("/admin/dashboard")).toBe("admin");
    expect(getRouteKind("/orders")).toBe("restaurant");
  });
});

describe("repository + server action mocks", () => {
  it("simulates CRUD order flow", async () => {
    const repos = createRepositoryMocks();
    const actions = createServerActionMocks();

    const created = await repos.order.create({
      restaurantId: createTestOrder().restaurantId,
    });
    expect(created.id).toBeTruthy();

    const listed = await repos.order.findMany({});
    expect(listed.items).toHaveLength(1);

    const actionResult = await actions.createOrder({});
    expect(actionResult.success).toBe(true);

    const denied = await actions.failOrder({});
    expect(denied.success).toBe(false);
  });

  it("simulates category and menu lookup", async () => {
    const repos = createRepositoryMocks();
    const categories = await repos.category.findMany({});
    const items = await repos.menuItem.findMany({});
    expect(categories.items[0]).toMatchObject({
      name: createTestCategory().name,
    });
    expect(items.items[0]).toMatchObject({
      name: createTestMenuItem().name,
    });
  });
});

describe("notification flow mock", () => {
  it("lists and marks notifications", async () => {
    const notifications = createNotificationMocks();
    const list = await notifications.list();
    expect(list.unreadCount).toBe(0);
    await notifications.notify({ title: "Order ready" });
    expect(notifications.notify).toHaveBeenCalled();
    await notifications.markRead("n1");
    expect(notifications.markRead).toHaveBeenCalledWith("n1");
  });
});

describe("settings + dashboard data foundation", () => {
  it("exposes preference defaults for settings forms", () => {
    expect(defaultPreferences).toHaveProperty("language");
    expect(createTestUser().restaurantId).toBeTruthy();
  });

  it("returns dashboard-shaped success payloads", () => {
    const payload = orderSuccess({
      ordersToday: 12,
      revenueToday: 4200,
      pendingKitchen: 3,
    });
    expect(payload.success).toBe(true);
    if (payload.success) {
      expect(payload.data.ordersToday).toBe(12);
    }
  });

  it("maps validation failures for settings updates", () => {
    const invalid = createCategorySchema.safeParse({
      name: "",
      slug: "bad slug!",
    });
    expect(invalid.success).toBe(false);
    expect(orderFailure("VALIDATION_ERROR", "Invalid settings").success).toBe(
      false
    );
  });
});

describe("validation layer integration", () => {
  it("composes auth + domain schemas", () => {
    const login = loginSchema.safeParse({
      email: "bad",
      password: "x",
    });
    expect(login.success).toBe(false);

    const category = createCategorySchema.safeParse({
      name: "Starters",
      slug: "starters",
      description: "",
      displayOrder: 0,
      color: "#16A34A",
      isActive: true,
    });
    expect(category.success).toBe(true);
  });
});

describe("vitest mock hygiene", () => {
  it("resets spies between assertions", () => {
    const spy = vi.fn();
    spy();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
