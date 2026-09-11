import { describe, it, expect } from "vitest";
import {
  calculateEffectiveQuantity,
  calculateRecipeLineCost,
  calculateTotalRecipeCost,
  determineStockStatus,
  calculateTotalStockValuation,
} from "@/lib/inventory/recipe-calculator";

describe("Recipe Costing & Inventory Calculations", () => {
  describe("Effective Quantity with Wastage", () => {
    it("returns raw quantity when wastage is 0%", () => {
      expect(calculateEffectiveQuantity(100, 0)).toBe(100);
    });

    it("factors in 10% wastage correctly", () => {
      // 100g with 10% wastage = 110g required
      expect(calculateEffectiveQuantity(100, 10)).toBe(110);
    });

    it("factors in 25% trim/shrinkage wastage correctly", () => {
      // 200g with 25% wastage = 250g required
      expect(calculateEffectiveQuantity(200, 25)).toBe(250);
    });
  });

  describe("Recipe Line Cost Calculation", () => {
    it("calculates cost when recipe line unit matches ingredient unit", () => {
      // 2 kg of flour at 40/kg with 0% waste = 80
      const cost = calculateRecipeLineCost(2, "kg", 40, "kg", 0);
      expect(cost).toBe(80);
    });

    it("calculates cost with unit conversion (e.g., recipe in grams, ingredient cost in kg)", () => {
      // 250g coffee beans, cost 800/kg, 0% waste -> 0.25kg * 800 = 200
      const cost = calculateRecipeLineCost(250, "g", 800, "kg", 0);
      expect(cost).toBe(200);
    });

    it("calculates cost with unit conversion and wastage combined", () => {
      // 200ml milk, cost 60/liter, 10% frothing waste:
      // effective = 200 * 1.10 = 220ml = 0.22 liter
      // cost = 0.22 * 60 = 13.20
      const cost = calculateRecipeLineCost(200, "ml", 60, "liter", 10);
      expect(cost).toBe(13.2);
    });
  });

  describe("Total Recipe Cost Calculation", () => {
    it("sums multiple ingredient line items accurately", () => {
      const lines = [
        { quantity: 18, unit: "g" as const, costPerUnit: 1000, ingredientUnit: "kg" as const, wastagePercentage: 5 }, // 18.9g * 1.00 = 18.90
        { quantity: 200, unit: "ml" as const, costPerUnit: 60, ingredientUnit: "liter" as const, wastagePercentage: 10 }, // 220ml * 0.06 = 13.20
        { quantity: 1, unit: "piece" as const, costPerUnit: 5, ingredientUnit: "piece" as const, wastagePercentage: 0 }, // 5.00
      ];

      const total = calculateTotalRecipeCost(lines);
      // 18.90 + 13.20 + 5.00 = 37.10
      expect(total).toBe(37.1);
    });
  });

  describe("Stock Status Determination", () => {
    it("returns OUT_OF_STOCK when current stock is 0 or negative", () => {
      expect(determineStockStatus(0, 5, 10)).toBe("OUT_OF_STOCK");
      expect(determineStockStatus(-2, 5, 10)).toBe("OUT_OF_STOCK");
    });

    it("returns LOW_STOCK when current stock is at or below minimumStock", () => {
      expect(determineStockStatus(3, 5, 10)).toBe("LOW_STOCK");
      expect(determineStockStatus(5, 5, 10)).toBe("LOW_STOCK");
    });

    it("returns LOW_STOCK when current stock is at or below reorderLevel", () => {
      expect(determineStockStatus(8, 5, 10)).toBe("LOW_STOCK");
      expect(determineStockStatus(10, 5, 10)).toBe("LOW_STOCK");
    });

    it("returns IN_STOCK when current stock is safely above reorder level", () => {
      expect(determineStockStatus(15, 5, 10)).toBe("IN_STOCK");
      expect(determineStockStatus(50, 5, 10)).toBe("IN_STOCK");
    });
  });

  describe("Stock Asset Valuation", () => {
    it("calculates current asset valuation based on non-negative stock", () => {
      expect(calculateTotalStockValuation(10, 50)).toBe(500);
      expect(calculateTotalStockValuation(2.5, 120)).toBe(300);
    });

    it("treats negative stock as 0 valuation for accounting conservatism", () => {
      expect(calculateTotalStockValuation(-5, 100)).toBe(0);
    });
  });
});
