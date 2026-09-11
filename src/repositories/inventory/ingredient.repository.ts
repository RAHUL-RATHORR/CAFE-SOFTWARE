import {
  connectToDatabase,
  handleDatabaseError,
  notDeletedFilter,
  toObjectId,
  isValidObjectId,
} from "@/lib/database";
import {
  IngredientModel,
  type IngredientDocument,
  StockMovementModel,
} from "@/models/inventory";
import { calculateStockStatus } from "@/lib/inventory/recipe-calculator";
import type {
  Ingredient,
  IngredientSelectOption,
  CreateIngredientInput,
  UpdateIngredientInput,
  SearchInventoryParams,
  InventoryUnit,
} from "@/types/inventory";

type Filter = Record<string, unknown>;

function serializeIngredientDoc(doc: IngredientDocument): Ingredient {
  const currentStock = doc.currentStock ?? 0;
  const minimumStock = doc.minimumStock ?? 0;
  const stockStatus = calculateStockStatus(currentStock, minimumStock);

  return {
    id: String(doc._id),
    restaurantId: String(doc.restaurantId),
    branchId: String(doc.branchId),
    name: doc.name,
    sku: doc.sku || "",
    category: doc.category || "General",
    description: doc.description || "",
    unit: doc.unit as InventoryUnit,
    currentStock,
    minimumStock,
    reorderLevel: doc.reorderLevel ?? 0,
    maximumStock: doc.maximumStock ?? null,
    costPerUnit: doc.costPerUnit ?? 0,
    isActive: Boolean(doc.isActive),
    stockStatus,
    allowNegativeStock: doc.allowNegativeStock !== false,
    createdBy: doc.createdBy ? String(doc.createdBy) : null,
    updatedBy: doc.updatedBy ? String(doc.updatedBy) : null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export class IngredientRepository {
  /**
   * Search and filter ingredients for tenant & branch with pagination
   */
  async listIngredients(
    restaurantId: string,
    branchIdOrParams: string | SearchInventoryParams = {},
    maybeParams: SearchInventoryParams = {}
  ): Promise<{ items: Ingredient[]; total: number; page: number; pageSize: number }> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");

    const params: SearchInventoryParams =
      typeof branchIdOrParams === "string"
        ? { ...maybeParams, branchId: branchIdOrParams }
        : branchIdOrParams || {};

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(params.pageSize || 20, 100));

    const query: Filter = {
      restaurantId: toObjectId(restaurantId),
    };

    if (params.branchId && isValidObjectId(params.branchId)) {
      query.branchId = toObjectId(params.branchId);
    }

    if (params.category && params.category !== "all") {
      query.category = params.category;
    }

    if (params.active === "active") {
      query.isActive = true;
    } else if (params.active === "inactive") {
      query.isActive = false;
    }

    if (params.q?.trim()) {
      const q = params.q.trim();
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    // Filter by stock status if requested
    if (params.status && params.status !== "all") {
      if (params.status === "OUT_OF_STOCK") {
        query.currentStock = { $lte: 0 };
      } else if (params.status === "LOW_STOCK") {
        query.currentStock = { $gt: 0 };
        query.$expr = { $lte: ["$currentStock", "$minimumStock"] };
      } else if (params.status === "IN_STOCK") {
        query.$expr = { $gt: ["$currentStock", "$minimumStock"] };
      }
    }

    const sortOrder = params.sortOrder === "desc" ? -1 : 1;
    const sortField = params.sortBy || "name";

    const [total, docs] = await Promise.all([
      IngredientModel.countDocuments(notDeletedFilter(query) as Filter),
      IngredientModel.find(notDeletedFilter(query) as Filter)
        .sort({ [sortField]: sortOrder, _id: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
    ]);

    return {
      items: (docs as unknown as IngredientDocument[]).map(serializeIngredientDoc),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get single ingredient by ID with tenant security
   */
  async getIngredientById(
    id: string,
    restaurantId: string,
    _branchId?: string
  ): Promise<Ingredient | null> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return null;

    const doc = await IngredientModel.findOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter
    )
      .lean()
      .exec();

    if (!doc) return null;
    return serializeIngredientDoc(doc as unknown as IngredientDocument);
  }

  /**
   * Create a new ingredient and optionally write opening stock movement
   */
  async createIngredient(
    restaurantId: string,
    input: CreateIngredientInput,
    userId?: string | null
  ): Promise<Ingredient> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");
    const branchId = input.branchId;
    if (!branchId || !isValidObjectId(branchId)) throw new Error("Invalid branch ID");

    // SKU uniqueness check in branch
    const cleanSku = (input.sku || input.name.substring(0, 4) + "-" + Date.now().toString(36).slice(-4))
      .trim()
      .toUpperCase();

    const existingSku = await IngredientModel.findOne(
      notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        branchId: toObjectId(branchId),
        sku: cleanSku,
      }) as Filter
    ).exec();

    if (existingSku) {
      throw new Error(`An ingredient with SKU '${cleanSku}' already exists in this branch.`);
    }

    const openingStock = Math.max(0, input.openingStock || 0);

    const created = await IngredientModel.create({
      restaurantId: toObjectId(restaurantId),
      branchId: toObjectId(branchId),
      name: input.name.trim(),
      sku: cleanSku,
      category: input.category?.trim() || "General",
      description: input.description?.trim() || "",
      unit: input.unit,
      currentStock: openingStock,
      minimumStock: Math.max(0, input.minimumStock || 0),
      reorderLevel: Math.max(0, input.reorderLevel || 0),
      maximumStock: input.maximumStock ? Math.max(0, input.maximumStock) : null,
      costPerUnit: Math.max(0, input.costPerUnit || 0),
      isActive: input.isActive !== false,
      allowNegativeStock: input.allowNegativeStock !== false,
      createdBy: userId && isValidObjectId(userId) ? toObjectId(userId) : null,
      updatedBy: userId && isValidObjectId(userId) ? toObjectId(userId) : null,
      isDeleted: false,
    });

    // Write initial OPENING_STOCK movement if opening stock > 0
    if (openingStock > 0) {
      await StockMovementModel.create({
        restaurantId: toObjectId(restaurantId),
        branchId: toObjectId(branchId),
        ingredientId: created._id as any,
        movementType: "OPENING_STOCK",
        quantity: openingStock,
        unit: input.unit,
        normalizedQuantity: openingStock,
        beforeStock: 0,
        afterStock: openingStock,
        costPerUnit: input.costPerUnit || 0,
        totalCost: openingStock * (input.costPerUnit || 0),
        referenceType: "opening",
        referenceId: null,
        referenceKey: `OPENING:${String(created._id)}`,
        reason: "Initial opening stock upon ingredient creation",
        notes: "",
        createdBy: userId && isValidObjectId(userId) ? toObjectId(userId) : null,
      });
    }

    return serializeIngredientDoc(created);
  }

  /**
   * Update ingredient details
   */
  async updateIngredient(
    id: string,
    restaurantId: string,
    input: UpdateIngredientInput,
    userId?: string | null
  ): Promise<Ingredient | null> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return null;

    const filter: Filter = notDeletedFilter({
      _id: toObjectId(id),
      restaurantId: toObjectId(restaurantId),
    }) as Filter;

    const existing = await IngredientModel.findOne(filter).exec();
    if (!existing) return null;

    const updateDoc: Record<string, unknown> = {
      updatedBy: userId && isValidObjectId(userId) ? toObjectId(userId) : null,
    };

    if (input.name !== undefined) updateDoc.name = input.name.trim();
    if (input.sku !== undefined) {
      const cleanSku = input.sku.trim().toUpperCase();
      if (cleanSku !== existing.sku) {
        const dup = await IngredientModel.findOne(
          notDeletedFilter({
            _id: { $ne: existing._id },
            restaurantId: toObjectId(restaurantId),
            branchId: existing.branchId,
            sku: cleanSku,
          }) as Filter
        ).exec();
        if (dup) {
          throw new Error(`An ingredient with SKU '${cleanSku}' already exists in this branch.`);
        }
        updateDoc.sku = cleanSku;
      }
    }
    if (input.category !== undefined) updateDoc.category = input.category.trim() || "General";
    if (input.description !== undefined) updateDoc.description = input.description.trim();
    if (input.unit !== undefined) updateDoc.unit = input.unit;
    if (input.minimumStock !== undefined) updateDoc.minimumStock = Math.max(0, input.minimumStock);
    if (input.reorderLevel !== undefined) updateDoc.reorderLevel = Math.max(0, input.reorderLevel);
    if (input.maximumStock !== undefined) {
      updateDoc.maximumStock = input.maximumStock ? Math.max(0, input.maximumStock) : null;
    }
    if (input.costPerUnit !== undefined) updateDoc.costPerUnit = Math.max(0, input.costPerUnit);
    if (input.isActive !== undefined) updateDoc.isActive = input.isActive;
    if (input.allowNegativeStock !== undefined) updateDoc.allowNegativeStock = input.allowNegativeStock;

    const updated = await IngredientModel.findOneAndUpdate(
      filter,
      { $set: updateDoc },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) return null;
    return serializeIngredientDoc(updated as unknown as IngredientDocument);
  }

  /**
   * Soft delete ingredient
   */
  async deleteIngredient(id: string, restaurantId: string, _branchId?: string): Promise<boolean> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return false;

    const res = await IngredientModel.updateOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
        },
      }
    ).exec();

    return res.modifiedCount > 0;
  }

  /**
   * Get low-stock and out-of-stock ingredients for quick alerts
   */
  async getLowStockIngredients(
    restaurantId: string,
    branchId?: string
  ): Promise<Ingredient[]> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) return [];

    const query: Filter = {
      restaurantId: toObjectId(restaurantId),
      isActive: true,
      $or: [
        { currentStock: { $lte: 0 } },
        { $expr: { $lte: ["$currentStock", "$minimumStock"] } },
      ],
    };

    if (branchId && isValidObjectId(branchId)) {
      query.branchId = toObjectId(branchId);
    }

    const docs = await IngredientModel.find(notDeletedFilter(query) as Filter)
      .sort({ currentStock: 1 })
      .limit(50)
      .lean()
      .exec();

    return (docs as unknown as IngredientDocument[]).map(serializeIngredientDoc);
  }

  /**
   * Calculate dashboard summary metrics
   */
  async getDashboardSummary(
    restaurantId: string,
    branchId?: string
  ): Promise<{
    totalIngredients: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalStockValue: number;
  }> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) {
      return {
        totalIngredients: 0,
        inStockCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalStockValue: 0,
      };
    }

    const query: Filter = {
      restaurantId: toObjectId(restaurantId),
      isActive: true,
    };

    if (branchId && isValidObjectId(branchId)) {
      query.branchId = toObjectId(branchId);
    }

    const docs = await IngredientModel.find(notDeletedFilter(query) as Filter)
      .select({ currentStock: 1, minimumStock: 1, costPerUnit: 1 })
      .lean()
      .exec();

    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    for (const doc of docs) {
      const stock = doc.currentStock ?? 0;
      const min = doc.minimumStock ?? 0;
      const cost = doc.costPerUnit ?? 0;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= min) {
        lowStockCount++;
      } else {
        inStockCount++;
      }

      if (stock > 0 && cost > 0) {
        totalStockValue += stock * cost;
      }
    }

    return {
      totalIngredients: docs.length,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
    };
  }

  /**
   * Fast dropdown select options for recipe builder and purchases
   */
  async listOptions(
    restaurantId: string,
    branchId?: string
  ): Promise<IngredientSelectOption[]> {
    try {
      await connectToDatabase();
      if (!isValidObjectId(restaurantId)) return [];

      const query: Filter = {
        restaurantId: toObjectId(restaurantId),
        status: "active",
      };

      if (branchId && isValidObjectId(branchId)) {
        query.branchId = toObjectId(branchId);
      }

      const docs = await IngredientModel.find(notDeletedFilter(query) as Filter)
        .sort({ name: 1 })
        .select({ name: 1, unit: 1, sku: 1, costPerUnit: 1, currentStock: 1 })
        .limit(300)
        .lean()
        .exec();

      return docs.map((doc) => ({
        value: String(doc._id),
        label: doc.name,
        meta: `${doc.unit} · ${doc.sku || "NO-SKU"}`,
        unit: doc.unit as InventoryUnit,
        costPerUnit: doc.costPerUnit || 0,
        currentStock: doc.currentStock || 0,
      }));
    } catch (error) {
      throw handleDatabaseError(error, "Failed to list ingredient options");
    }
  }

  async getIngredientOptions(
    restaurantId: string,
    branchId?: string
  ): Promise<IngredientSelectOption[]> {
    return this.listOptions(restaurantId, branchId);
  }
}

export const ingredientRepository = new IngredientRepository();

Object.getOwnPropertyNames(IngredientRepository.prototype).forEach((key) => {
  if (key !== "constructor" && typeof (IngredientRepository.prototype as any)[key] === "function") {
    (IngredientRepository as any)[key] = (IngredientRepository.prototype as any)[key].bind(ingredientRepository);
  }
});
