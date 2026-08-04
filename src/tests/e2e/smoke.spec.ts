import { test, expect } from "@playwright/test";

/**
 * Smoke E2E foundation — routes must respond without crashing.
 * Auth-gated pages may redirect to /login; both outcomes are valid.
 */

async function expectAppShell(
  page: import("@playwright/test").Page,
  path: string
) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  const status = response?.status() ?? 0;
  // Allow success, redirects, and auth challenges — reject hard server failures.
  expect(status === 0 || status < 500).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
}

test.describe("Authentication", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    const email = page.locator('input[type="email"], input[name="email"]').first();
    await expect(email).toBeVisible();
  });
});

test.describe("Core modules smoke", () => {
  const routes = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Orders", path: "/orders" },
    { name: "Kitchen", path: "/kitchen" },
    { name: "Billing", path: "/billing" },
    { name: "Customers", path: "/customers" },
    { name: "Purchases", path: "/purchases" },
    { name: "Reports", path: "/reports" },
    { name: "Staff", path: "/staff" },
    { name: "Settings", path: "/settings" },
    { name: "Subscription", path: "/subscription" },
    { name: "Super Admin", path: "/admin" },
    { name: "Notifications", path: "/notifications" },
  ] as const;

  for (const route of routes) {
    test(`${route.name} is reachable`, async ({ page }) => {
      await expectAppShell(page, route.path);
      const url = page.url();
      expect(
        url.includes(route.path) ||
          url.includes("/login") ||
          url.includes("/onboarding")
      ).toBeTruthy();
    });
  }
});

test.describe("Public health", () => {
  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty("ok");
    expect(body).toHaveProperty("version");
  });
});

test.describe("Inventory alias", () => {
  test("purchases covers inventory workflows entry", async ({ page }) => {
    await expectAppShell(page, "/purchases");
  });
});
