import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/utils/format";
import {
  getRouteKind,
  getSafeCallbackUrl,
  isProtectedRoute,
  isPublicRoute,
} from "@/lib/auth/routing";
import { hasPermission, hasRole } from "@/lib/rbac/helpers";
import { themeConfig } from "@/config/theme";
import { defaultPreferences, THEME_STORAGE_KEY } from "@/config/preferences";
import { loginSchema } from "@/lib/validations/auth";
import { createCategorySchema } from "@/lib/validators/category/schemas";
import { orderSuccess, orderFailure, zodFieldErrors } from "@/lib/orders/result";
import { computeDiscountAmount, computeLineSubtotal } from "@/lib/billing/pricing";
import { productionConfig } from "@/config/production";
import { createId, createTraceContext, elapsedMs } from "@/lib/tracing";
import { sanitizeText, maskSensitiveData } from "@/lib/security";
import { appCache } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

describe("cn utility", () => {
  it("merges class names and resolves conflicts", () => {
    expect(cn("px-2", "px-4")).toContain("px-4");
    expect(cn("text-sm", false && "hidden", "font-medium")).toBe(
      "text-sm font-medium"
    );
  });
});

describe("formatters", () => {
  it("formats currency and numbers", () => {
    expect(formatCurrency(100, "USD", "en-US")).toContain("100");
    expect(formatNumber(1234, "en-US")).toBe("1,234");
  });
});

describe("auth routing", () => {
  it("classifies routes correctly", () => {
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(isPublicRoute("/menu/demo")).toBe(true);
    expect(isPublicRoute("/api/health")).toBe(true);
    expect(getRouteKind("/login")).toBe("guest");
    expect(getRouteKind("/admin")).toBe("admin");
    expect(getRouteKind("/orders")).toBe("restaurant");
  });

  it("sanitizes callback urls", () => {
    expect(getSafeCallbackUrl("/orders")).toBe("/orders");
    expect(getSafeCallbackUrl("//evil.com")).toBe("/dashboard");
    expect(getSafeCallbackUrl("https://evil.com")).toBe("/dashboard");
    expect(getSafeCallbackUrl(null)).toBe("/dashboard");
  });
});

describe("rbac helpers", () => {
  it("checks roles and permissions", () => {
    expect(hasRole("manager", ["manager", "cashier"])).toBe(true);
    expect(hasRole("chef", "manager")).toBe(false);
    expect(hasPermission("super-admin", "orders.view")).toBe(true);
    expect(hasPermission(null, "orders.view")).toBe(false);
  });
});

describe("theme and preferences config", () => {
  it("exposes theme tokens and preference defaults", () => {
    expect(themeConfig.modes).toContain("light");
    expect(themeConfig.colors.primary).toMatch(/^#/);
    expect(THEME_STORAGE_KEY).toBeTruthy();
    expect(defaultPreferences.language).toBeDefined();
  });
});

describe("validation schemas", () => {
  it("validates login payloads", () => {
    const ok = loginSchema.safeParse({
      email: "admin@dineflow.local",
      password: "Demo@12345",
      rememberMe: true,
    });
    expect(ok.success).toBe(true);

    const bad = loginSchema.safeParse({
      email: "not-an-email",
      password: "",
    });
    expect(bad.success).toBe(false);
  });

  it("validates category creation", () => {
    const ok = createCategorySchema.safeParse({
      name: "Beverages",
      slug: "beverages",
      description: "Hot and cold drinks",
      displayOrder: 1,
      color: "#2563EB",
      isActive: true,
    });
    expect(ok.success).toBe(true);
  });
});

describe("repository / action result helpers", () => {
  it("builds success and failure results", () => {
    expect(orderSuccess({ id: "1" })).toEqual({
      success: true,
      data: { id: "1" },
    });
    const fail = orderFailure("VALIDATION_ERROR", "Invalid", {
      name: ["Required"],
    });
    expect(fail.success).toBe(false);
    if (!fail.success) {
      expect(fail.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("maps zod issues to field errors", () => {
    expect(
      zodFieldErrors([{ path: ["email"], message: "Invalid email" }])
    ).toEqual({ email: ["Invalid email"] });
  });
});

describe("billing pricing helpers", () => {
  it("computes line subtotals and discounts", () => {
    expect(computeLineSubtotal({ price: 80, quantity: 2 })).toBe(160);
    expect(computeDiscountAmount(200, "percentage", 10)).toBe(20);
    expect(computeDiscountAmount(200, "fixed", 25)).toBe(25);
  });
});

describe("production foundations", () => {
  it("creates trace context and elapsed timing", () => {
    const trace = createTraceContext({ operation: "test" });
    expect(trace.requestId).toBeTruthy();
    expect(createId("req")).toMatch(/^req_/);
    expect(elapsedMs(trace)).toBeGreaterThanOrEqual(0);
  });

  it("sanitizes and masks sensitive values", () => {
    expect(sanitizeText("<b>Hello</b>")).toBe("Hello");
    expect(maskSensitiveData({ password: "secret", name: "Ada" })).toEqual({
      password: "[REDACTED]",
      name: "Ada",
    });
  });

  it("supports in-memory cache and rate limit foundation", () => {
    appCache.set("lookup", "currency", "INR", 60);
    expect(appCache.get("lookup", "currency")).toBe("INR");
    appCache.invalidate("lookup", "currency");
    expect(appCache.get("lookup", "currency")).toBeNull();

    const allowed = checkRateLimit("api", "unit-test-identity");
    expect(allowed.allowed).toBe(true);
    expect(productionConfig.app.name).toBeTruthy();
  });
});
