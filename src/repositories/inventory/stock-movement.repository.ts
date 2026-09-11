import {
  connectToDatabase,
  toObjectId,
  isValidObjectId,
} from "@/lib/database";
import {
  StockMovementModel,
  type StockMovementDocument,
  IngredientModel,
} from "@/models/inventory";
import { convertUnitQuantity } from "@/lib/inventory/unit-converter";
import type {
  StockMovement,
  ReceiveStockInput,
  AdjustStockInput,
  RecordWasteInput,
  InventoryUnit,
} from "@/types/inventory";

type Filter = Record<string, unknown>;

function serializeMovementDoc(
  doc: StockMovementDocument,
  ingredientName?: string,
  userName?: string
): StockMovement {
  return {
    id: String(doc._id),
    restaurantId: String(doc.restaurantId),
    branchId: String(doc.branchId),
    ingredientId: String(doc.ingredientId),
    ingredientName: ingredientName || undefined,
    movementType: doc.movementType as StockMovement["movementType"],
    quantity: doc.quantity,
    unit: doc.unit as InventoryUnit,
    normalizedQuantity: doc.normalizedQuantity,
    beforeStock: doc.beforeStock,
    afterStock: doc.afterStock,
    costPerUnit: doc.costPerUnit,
    totalCost: doc.totalCost,
    referenceType: doc.referenceType as StockMovement["referenceType"],
    referenceId: doc.referenceId || null,
    referenceKey: doc.referenceKey || null,
    reason: doc.reason || "",
    notes: doc.notes || "",
    createdBy: doc.createdBy ? String(doc.createdBy) : null,
    createdByName: userName || null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  };
}

export class StockMovementRepository {
  /**
   * Receive stock (Goods Receipt / Stock In)
   * Atomically updates current stock and creates PURCHASE movement.
   */
  async recordPurchase(
    restaurantId: string,
    branchIdOrInput: string | ReceiveStockInput,
    inputOrUserId?: ReceiveStockInput | string | null,
    maybeUserId?: string | null
  ): Promise<StockMovement> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");

    const input: ReceiveStockInput =
      typeof branchIdOrInput === "string"
        ? (inputOrUserId as ReceiveStockInput)
        : branchIdOrInput;
    const userId =
      typeof branchIdOrInput === "string"
        ? maybeUserId
        : (inputOrUserId as string | null | undefined);

    if (!isValidObjectId(input.ingredientId)) throw new Error("Invalid ingredient ID");
    if (input.quantity <= 0) throw new Error("Received quantity must be greater than zero");

    const ingredient = await IngredientModel.findOne({
      _id: toObjectId(input.ingredientId),
      restaurantId: toObjectId(restaurantId),
      isDeleted: false,
    } as any).exec();

    if (!ingredient) {
      throw new Error("Ingredient not found in restaurant.");
    }

    // Normalize received quantity into ingredient's base unit
    const normalizedDelta = convertUnitQuantity(
      input.quantity,
      input.unit,
      ingredient.unit as InventoryUnit
    );

    const beforeStock = ingredient.currentStock ?? 0;
    const afterStock = Math.round((beforeStock + normalizedDelta) * 10000) / 10000;

    const unitCost = input.costPerUnit !== undefined && input.costPerUnit >= 0
      ? input.costPerUnit
      : ingredient.costPerUnit;

    const totalCost = Math.round(normalizedDelta * unitCost * 100) / 100;

    // Atomically increment stock and update costPerUnit if provided
    ingredient.currentStock = afterStock;
    if (input.costPerUnit !== undefined && input.costPerUnit > 0) {
      ingredient.costPerUnit = input.costPerUnit;
    }
    await (ingredient as any).save();

    // Create immutable ledger entry
    const movement = await StockMovementModel.create({
      restaurantId: toObjectId(restaurantId),
      branchId: ingredient.branchId,
      ingredientId: ingredient._id as any,
      movementType: "PURCHASE",
      quantity: input.quantity,
      unit: input.unit,
      normalizedQuantity: normalizedDelta,
      beforeStock,
      afterStock,
      costPerUnit: unitCost,
      totalCost,
      referenceType: "purchase",
      referenceId: input.reference?.trim() || null,
      reason: "Stock received / purchased",
      notes: input.notes?.trim() || "",
      createdBy: userId && isValidObjectId(userId) ? toObjectId(userId) : null,
    });

    return serializeMovementDoc(movement, ingredient.name);
  }

  /**
   * Manual Stock Adjustment (ADD / REMOVE / SET)
   */
  async recordAdjustment(
    restaurantId: string,
    branchIdOrInput: string | AdjustStockInput | { ingredientId: string; adjustmentType: string; quantity: number; unit?: any; notes?: string },
    inputOrUserId?: any,
    maybeUserId?: string | null
  ): Promise<StockMovement> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");

    const rawInput: any =
      typeof branchIdOrInput === "string"
        ? inputOrUserId
        : branchIdOrInput;
    const userId =
      typeof branchIdOrInput === "string"
        ? maybeUserId
        : inputOrUserId;

    const op = rawInput.adjustmentType
      ? (rawInput.adjustmentType.replace("ADJUSTMENT_", "") as "ADD" | "REMOVE" | "SET")
      : rawInput.operation || "ADD";

    const input: AdjustStockInput = {
      branchId: rawInput.branchId || (typeof branchIdOrInput === "string" ? branchIdOrInput : ""),
      ingredientId: rawInput.ingredientId,
      operation: op,
      quantity: rawInput.quantity,
      unit: rawInput.unit || "piece",
      reason: rawInput.reason || rawInput.notes || "Manual stock adjustment",
      notes: rawInput.notes || "",
    };

    if (!isValidObjectId(input.ingredientId)) throw new Error("Invalid ingredient ID");

    const ingredient = await IngredientModel.findOne({
      _id: toObjectId(input.ingredientId),
      restaurantId: toObjectId(restaurantId),
      isDeleted: false,
    } as any).exec();

    if (!ingredient) {
      throw new Error("Ingredient not found in restaurant.");
    }

    const beforeStock = ingredient.currentStock ?? 0;
    let normalizedDelta = 0;
    let afterStock = beforeStock;
    let movementType: StockMovement["movementType"] = "ADJUSTMENT_ADD";

    if (input.operation === "ADD") {
      if (input.quantity <= 0) throw new Error("Quantity must be greater than zero");
      normalizedDelta = convertUnitQuantity(
        input.quantity,
        input.unit,
        ingredient.unit as InventoryUnit
      );
      afterStock = Math.round((beforeStock + normalizedDelta) * 10000) / 10000;
      movementType = "ADJUSTMENT_ADD";
    } else if (input.operation === "REMOVE") {
      if (input.quantity <= 0) throw new Error("Quantity must be greater than zero");
      normalizedDelta = -convertUnitQuantity(
        input.quantity,
        input.unit,
        ingredient.unit as InventoryUnit
      );
      afterStock = Math.round((beforeStock + normalizedDelta) * 10000) / 10000;
      movementType = "ADJUSTMENT_REMOVE";
    } else if (input.operation === "SET") {
      const targetStockInIngredientUnit = convertUnitQuantity(
        input.quantity,
        input.unit,
        ingredient.unit as InventoryUnit
      );
      normalizedDelta = Math.round((targetStockInIngredientUnit - beforeStock) * 10000) / 10000;
      afterStock = targetStockInIngredientUnit;
      movementType = "ADJUSTMENT_SET";
    }

    ingredient.currentStock = afterStock;
    await (ingredient as any).save();

    const totalCost = Math.round(Math.abs(normalizedDelta) * ingredient.costPerUnit * 100) / 100;

    const movement = await StockMovementModel.create({
      restaurantId: toObjectId(restaurantId),
      branchId: ingredient.branchId,
      ingredientId: ingredient._id as any,
      movementType,
      quantity: input.quantity,
      unit: input.unit,
      normalizedQuantity: normalizedDelta,
      beforeStock,
      afterStock,
      costPerUnit: ingredient.costPerUnit,
      totalCost,
      referenceType: "adjustment",
      referenceId: null,
      reason: input.reason.trim(),
      notes: input.notes?.trim() || "",
      createdBy: userId && isValidObjectId(userId) ? toObjectId(userId) : null,
    });

    return serializeMovementDoc(movement, ingredient.name);
  }

  /**
   * Record Waste / Spoilage / Damage
   */
  async recordWaste(
    restaurantId: string,
    branchIdOrInput: string | RecordWasteInput | { ingredientId: string; quantity: number; unit?: any; notes?: string },
    inputOrUserId?: any,
    maybeUserId?: string | null
  ): Promise<StockMovement> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");

    const rawInput: any =
      typeof branchIdOrInput === "string"
        ? inputOrUserId
        : branchIdOrInput;
    const userId =
      typeof branchIdOrInput === "string"
        ? maybeUserId
        : inputOrUserId;

    const input: RecordWasteInput = {
      branchId: rawInput.branchId || (typeof branchIdOrInput === "string" ? branchIdOrInput : ""),
      ingredientId: rawInput.ingredientId,
      quantity: rawInput.quantity,
      unit: rawInput.unit || "piece",
      reason: rawInput.reason || rawInput.notes || "Stock waste / spoilage",
      notes: rawInput.notes || "",
    };

    if (!isValidObjectId(input.ingredientId)) throw new Error("Invalid ingredient ID");
    if (input.quantity <= 0) throw new Error("Waste quantity must be greater than zero");
    if (!input.reason?.trim()) throw new Error("A reason is required to record stock waste");

    const ingredient = await IngredientModel.findOne({
      _id: toObjectId(input.ingredientId),
      restaurantId: toObjectId(restaurantId),
      isDeleted: false,
    } as any).exec();

    if (!ingredient) {
      throw new Error("Ingredient not found in restaurant.");
    }

    const normalizedWasted = convertUnitQuantity(
      input.quantity,
      input.unit,
      ingredient.unit as InventoryUnit
    );

    const beforeStock = ingredient.currentStock ?? 0;
    const afterStock = Math.round((beforeStock - normalizedWasted) * 10000) / 10000;

    ingredient.currentStock = afterStock;
    await (ingredient as any).save();

    const totalCost = Math.round(normalizedWasted * ingredient.costPerUnit * 100) / 100;

    const movement = await StockMovementModel.create({
      restaurantId: toObjectId(restaurantId),
      branchId: ingredient.branchId,
      ingredientId: ingredient._id as any,
      movementType: "WASTE",
      quantity: -input.quantity,
      unit: input.unit,
      normalizedQuantity: -normalizedWasted,
      beforeStock,
      afterStock,
      costPerUnit: ingredient.costPerUnit,
      totalCost,
      referenceType: "waste",
      referenceId: null,
      reason: input.reason.trim(),
      notes: input.notes?.trim() || "",
      createdBy: userId && isValidObjectId(userId) ? toObjectId(userId) : null,
    });

    return serializeMovementDoc(movement, ingredient.name);
  }

  /**
   * List stock movements with filtering and pagination
   */
  async listMovements(
    restaurantId: string,
    branchIdOrParams: string | {
      branchId?: string;
      ingredientId?: string;
      movementType?: string;
      page?: number;
      pageSize?: number;
    } = {},
    maybeParams: {
      ingredientId?: string;
      movementType?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ items: StockMovement[]; total: number; page: number; pageSize: number }> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");

    const params =
      typeof branchIdOrParams === "string"
        ? { ...maybeParams, branchId: branchIdOrParams }
        : branchIdOrParams || {};

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(params.pageSize || 30, 100));

    const query: Filter = {
      restaurantId: toObjectId(restaurantId),
    };

    if (params.branchId && isValidObjectId(params.branchId)) {
      query.branchId = toObjectId(params.branchId);
    }
    if (params.ingredientId && isValidObjectId(params.ingredientId)) {
      query.ingredientId = toObjectId(params.ingredientId);
    }
    if (params.movementType && params.movementType !== "all") {
      query.movementType = params.movementType;
    }

    const [total, docs] = await Promise.all([
      StockMovementModel.countDocuments(query),
      StockMovementModel.find(query)
        .populate("ingredientId", "name unit")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
    ]);

    const items = (docs as unknown as Array<StockMovementDocument & {
      ingredientId?: { name?: string };
      createdBy?: { name?: string };
    }>).map((doc) => {
      const ingName = doc.ingredientId && typeof doc.ingredientId === "object"
        ? doc.ingredientId.name
        : undefined;
      const userName = doc.createdBy && typeof doc.createdBy === "object"
        ? doc.createdBy.name
        : undefined;
      return serializeMovementDoc(doc, ingName, userName);
    });

    return {
      items,
      total,
      page,
      pageSize,
    };
  }
}

export const stockMovementRepository = new StockMovementRepository();

Object.getOwnPropertyNames(StockMovementRepository.prototype).forEach((key) => {
  if (key !== "constructor" && typeof (StockMovementRepository.prototype as any)[key] === "function") {
    (StockMovementRepository as any)[key] = (StockMovementRepository.prototype as any)[key].bind(stockMovementRepository);
  }
});
