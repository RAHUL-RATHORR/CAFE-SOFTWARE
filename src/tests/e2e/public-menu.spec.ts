import { test, expect } from "@playwright/test";

test.describe("Public QR menu", () => {
  test("public menu route does not require auth shell crash", async ({
    page,
  }) => {
    const response = await page.goto("/menu/demo", {
      waitUntil: "domcontentloaded",
    });
    const status = response?.status() ?? 0;
    expect(status === 0 || status < 500).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });
});
