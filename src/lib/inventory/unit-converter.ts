import type { InventoryUnit } from "@/types/inventory";

export class UnitConversionError extends Error {
  code = "INVALID_UNIT_CONVERSION";
  constructor(fromUnit: string, toUnit: string) {
    super(`Cannot convert incompatible units from '${fromUnit}' to '${toUnit}'.`);
    this.name = "UnitConversionError";
    Object.setPrototypeOf(this, UnitConversionError.prototype);
  }
}

/**
 * Normalizes any quantity into the target unit.
 *
 * Weight conversions:
 * - 1 kg = 1000 g
 * - 1 g = 0.001 kg
 *
 * Volume conversions:
 * - 1 liter = 1000 ml
 * - 1 ml = 0.001 liter
 *
 * Count items (piece, packet, box, bottle):
 * - Must match exactly, otherwise throws UnitConversionError.
 */
export function convertUnitQuantity(
  quantity: number,
  fromUnit: InventoryUnit,
  toUnit: InventoryUnit
): number {
  if (fromUnit === toUnit) {
    return quantity;
  }

  // Weight Category
  if ((fromUnit === "kg" || fromUnit === "g") && (toUnit === "kg" || toUnit === "g")) {
    if (fromUnit === "kg" && toUnit === "g") {
      return Math.round(quantity * 1000 * 10000) / 10000;
    }
    if (fromUnit === "g" && toUnit === "kg") {
      return Math.round((quantity / 1000) * 10000) / 10000;
    }
  }

  // Volume Category
  if ((fromUnit === "liter" || fromUnit === "ml") && (toUnit === "liter" || toUnit === "ml")) {
    if (fromUnit === "liter" && toUnit === "ml") {
      return Math.round(quantity * 1000 * 10000) / 10000;
    }
    if (fromUnit === "ml" && toUnit === "liter") {
      return Math.round((quantity / 1000) * 10000) / 10000;
    }
  }

  throw new UnitConversionError(fromUnit, toUnit);
}

export const convertUnit = convertUnitQuantity;

/**
 * Checks whether two units can be converted to each other.
 */
export function areUnitsCompatible(
  unitA: InventoryUnit,
  unitB: InventoryUnit
): boolean {
  if (unitA === unitB) return true;
  if ((unitA === "kg" || unitA === "g") && (unitB === "kg" || unitB === "g")) return true;
  if ((unitA === "liter" || unitA === "ml") && (unitB === "liter" || unitB === "ml")) return true;
  return false;
}

/**
 * Gets the dimension (mass, volume, count) for a unit.
 */
export function getUnitDimension(unit: InventoryUnit): "mass" | "volume" | "count" {
  if (unit === "kg" || unit === "g") return "mass";
  if (unit === "liter" || unit === "ml") return "volume";
  return "count";
}

/**
 * Normalizes quantity to standard base unit (kg for mass, liter for volume, original for count).
 */
export function normalizeQuantity(
  quantity: number,
  unit: InventoryUnit
): { quantity: number; baseUnit: InventoryUnit } {
  if (unit === "g") {
    return { quantity: Math.round((quantity / 1000) * 10000) / 10000, baseUnit: "kg" };
  }
  if (unit === "ml") {
    return { quantity: Math.round((quantity / 1000) * 10000) / 10000, baseUnit: "liter" };
  }
  return { quantity, baseUnit: unit };
}
