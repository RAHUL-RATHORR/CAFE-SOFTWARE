import { describe, it, expect } from "vitest";
import {
  convertUnit,
  areUnitsCompatible,
  getUnitDimension,
  normalizeQuantity,
  UnitConversionError,
} from "@/lib/inventory/unit-converter";

describe("Inventory Unit Converter", () => {
  describe("Mass Conversions", () => {
    it("converts kg to g correctly", () => {
      expect(convertUnit(1.5, "kg", "g")).toBe(1500);
      expect(convertUnit(0.25, "kg", "g")).toBe(250);
    });

    it("converts g to kg correctly", () => {
      expect(convertUnit(500, "g", "kg")).toBe(0.5);
      expect(convertUnit(18, "g", "kg")).toBe(0.018);
    });

    it("returns identical quantity when units match", () => {
      expect(convertUnit(10, "kg", "kg")).toBe(10);
      expect(convertUnit(250, "g", "g")).toBe(250);
    });
  });

  describe("Volume Conversions", () => {
    it("converts liter to ml correctly", () => {
      expect(convertUnit(2, "liter", "ml")).toBe(2000);
      expect(convertUnit(0.15, "liter", "ml")).toBe(150);
    });

    it("converts ml to liter correctly", () => {
      expect(convertUnit(750, "ml", "liter")).toBe(0.75);
      expect(convertUnit(200, "ml", "liter")).toBe(0.2);
    });
  });

  describe("Count Units", () => {
    it("converts count units within the same unit", () => {
      expect(convertUnit(12, "piece", "piece")).toBe(12);
      expect(convertUnit(5, "packet", "packet")).toBe(5);
      expect(convertUnit(2, "box", "box")).toBe(2);
      expect(convertUnit(4, "bottle", "bottle")).toBe(4);
    });
  });

  describe("Incompatible Unit Validation", () => {
    it("detects compatible and incompatible unit pairs", () => {
      expect(areUnitsCompatible("kg", "g")).toBe(true);
      expect(areUnitsCompatible("liter", "ml")).toBe(true);
      expect(areUnitsCompatible("kg", "liter")).toBe(false);
      expect(areUnitsCompatible("g", "piece")).toBe(false);
      expect(areUnitsCompatible("ml", "packet")).toBe(false);
    });

    it("throws UnitConversionError when attempting to convert cross-dimension", () => {
      expect(() => convertUnit(1, "kg", "liter")).toThrow(UnitConversionError);
      expect(() => convertUnit(500, "ml", "piece")).toThrow(UnitConversionError);
    });

    it("identifies correct unit dimensions", () => {
      expect(getUnitDimension("kg")).toBe("mass");
      expect(getUnitDimension("g")).toBe("mass");
      expect(getUnitDimension("liter")).toBe("volume");
      expect(getUnitDimension("ml")).toBe("volume");
      expect(getUnitDimension("piece")).toBe("count");
    });
  });

  describe("Normalization to base unit", () => {
    it("normalizes g to kg with baseUnit 'kg'", () => {
      const normalized = normalizeQuantity(250, "g");
      expect(normalized.quantity).toBe(0.25);
      expect(normalized.baseUnit).toBe("kg");
    });

    it("normalizes ml to liter with baseUnit 'liter'", () => {
      const normalized = normalizeQuantity(600, "ml");
      expect(normalized.quantity).toBe(0.6);
      expect(normalized.baseUnit).toBe("liter");
    });

    it("keeps count units intact", () => {
      const normalized = normalizeQuantity(10, "piece");
      expect(normalized.quantity).toBe(10);
      expect(normalized.baseUnit).toBe("piece");
    });
  });
});
