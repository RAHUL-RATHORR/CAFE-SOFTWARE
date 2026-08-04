import { describe, expect, it } from "vitest";
import {
  isProtectedRoute,
  isPublicRoute,
  getRouteKind,
} from "@/lib/auth/routing";

describe("auth routing v1.0 coverage", () => {
  it("protects vendors, purchases, staff, shifts, and subscription", () => {
    expect(isProtectedRoute("/vendors")).toBe(true);
    expect(isProtectedRoute("/purchases/new")).toBe(true);
    expect(isProtectedRoute("/staff")).toBe(true);
    expect(isProtectedRoute("/shifts")).toBe(true);
    expect(isProtectedRoute("/subscription/plans")).toBe(true);
  });

  it("keeps public menu and health public", () => {
    expect(isPublicRoute("/menu/demo")).toBe(true);
    expect(isPublicRoute("/api/health")).toBe(true);
    expect(getRouteKind("/menu/x")).toBe("public");
  });
});
