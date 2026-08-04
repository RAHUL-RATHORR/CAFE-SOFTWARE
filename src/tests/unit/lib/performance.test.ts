import { describe, expect, it } from "vitest";
import {
  buildCacheKey,
  dashboardCacheKey,
  menuCacheKey,
} from "@/lib/cache/keys";
import {
  computeVirtualWindow,
  shouldVirtualize,
  sliceWindow,
} from "@/lib/tables/virtualization";
import { clampPageSize, buildProjection } from "@/lib/database/query";
import { rateWebVital } from "@/lib/performance/web-vitals";

describe("cache keys", () => {
  it("builds stable namespaced keys", () => {
    expect(buildCacheKey("menu", ["Rest A", 1])).toBe("menu:rest-a:1");
    expect(dashboardCacheKey("r1")).toContain("dashboard:r1");
    expect(menuCacheKey("r1", null)).toContain("all");
  });
});

describe("table virtualization helpers", () => {
  it("computes a visible window", () => {
    const window = computeVirtualWindow({
      scrollTop: 400,
      viewportHeight: 400,
      rowHeight: 40,
      totalRows: 200,
      overscan: 2,
    });
    expect(window.startIndex).toBeGreaterThanOrEqual(0);
    expect(window.endIndex).toBeGreaterThan(window.startIndex);
    expect(shouldVirtualize(200)).toBe(true);
    expect(shouldVirtualize(10)).toBe(false);
    expect(sliceWindow([1, 2, 3, 4, 5], { startIndex: 1, endIndex: 3 })).toEqual([
      2, 3,
    ]);
  });
});

describe("database query helpers", () => {
  it("clamps page size and builds projections", () => {
    expect(clampPageSize(500)).toBe(100);
    expect(clampPageSize(0)).toBe(1);
    expect(buildProjection(["name", "price"])).toEqual({ name: 1, price: 1 });
  });
});

describe("web vital rating", () => {
  it("rates against budgets", () => {
    expect(rateWebVital("LCP", 1000)).toBe("good");
    expect(rateWebVital("LCP", 4000)).toBe("poor");
    expect(rateWebVital("CLS", 0.05)).toBe("good");
  });
});
