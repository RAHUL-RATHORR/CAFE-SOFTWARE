/**
 * Inventory & Recipe Management System Types — Prompt 49
 *
 * Scoped by Restaurant -> Branch -> Ingredients -> Recipes -> Stock Movements.
 */

export const INVENTORY_UNITS = [
  "kg",
  "g",
  "liter",
  "ml",
  "piece",
  "packet",
  "box",
  "bottle",
] as const;

export type InventoryUnit = (typeof INVENTORY_UNITS)[number];

export const INVENTORY_CATEGORIES = [
  "Dry Goods",
  "Produce",
  "Dairy",
  "Meat & Poultry",
  "Seafood",
  "Spices & Seasoning",
  "Beverages",
  "Packaging",
  "General",
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const INVENTORY_UNIT_CATEGORIES = {
  weight: ["kg", "g"],
  volume: ["liter", "ml"],
  count: ["piece", "packet", "box", "bottle"],
} as const;

export const INGREDIENT_STATUSES = ["active", "inactive"] as const;
export type IngredientStatus = (typeof INGREDIENT_STATUSES)[number];

export const STOCK_STATUSES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const STOCK_MOVEMENT_TYPES = [
  "OPENING_STOCK",
  "PURCHASE",
  "CONSUMPTION",
  "ADJUSTMENT_ADD",
  "ADJUSTMENT_REMOVE",
  "ADJUSTMENT_SET",
  "WASTE",
  "RETURN",
  "REVERSAL",
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_REFERENCE_TYPES = [
  "order",
  "purchase",
  "manual",
  "waste",
  "opening",
] as const;
export type StockReferenceType = (typeof STOCK_REFERENCE_TYPES)[number];

export type StockPolicy = "ALLOW_NEGATIVE_STOCK" | "BLOCK_IF_INSUFFICIENT_STOCK";

export type Ingredient = {
  id: string;
  restaurantId: string;
  branchId: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  maximumStock: number | null;
  costPerUnit: number;
  totalValuation?: number;
  storageLocation?: string;
  isActive: boolean;
  stockStatus: StockStatus;
  allowNegativeStock: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IngredientSelectOption = {
  value: string;
  label: string;
  meta?: string;
  unit?: InventoryUnit;
  costPerUnit?: number;
  currentStock?: number;
};

export type CreateIngredientInput = {
  branchId?: string;
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  unit: InventoryUnit;
  openingStock?: number;
  initialStock?: number;
  minimumStock?: number;
  reorderLevel?: number;
  maximumStock?: number | null;
  costPerUnit?: number;
  storageLocation?: string;
  isActive?: boolean;
  allowNegativeStock?: boolean;
};

export type UpdateIngredientInput = Partial<
  Omit<CreateIngredientInput, "branchId" | "openingStock">
>;

export type StockMovement = {
  id: string;
  restaurantId: string;
  branchId: string;
  ingredientId: string;
  ingredientName?: string;
  movementType: StockMovementType;
  quantity: number;
  unit: InventoryUnit;
  normalizedQuantity: number;
  beforeStock: number;
  afterStock: number;
  stockBefore?: number;
  stockAfter?: number;
  costPerUnit: number;
  totalCost: number;
  referenceType: StockReferenceType;
  referenceId: string | null;
  referenceKey: string | null;
  reason: string;
  notes: string;
  createdBy: string | null;
  createdByName?: string | null;
  createdAt: string;
};

export type ReceiveStockInput = {
  branchId?: string;
  ingredientId: string;
  quantity: number;
  unit: InventoryUnit;
  costPerUnit?: number;
  reference?: string;
  notes?: string;
};

export type AdjustStockInput = {
  branchId?: string;
  ingredientId: string;
  operation: "ADD" | "REMOVE" | "SET";
  quantity: number;
  unit: InventoryUnit;
  reason: string;
  notes?: string;
};

export type RecordWasteInput = {
  branchId?: string;
  ingredientId: string;
  quantity: number;
  unit: InventoryUnit;
  reason: string;
  notes?: string;
};

export type RecipeIngredientLine = {
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
  unit: InventoryUnit;
  wastagePercentage: number;
  costEstimate?: number;
};

export type Recipe = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  menuItemId: string;
  menuItemName?: string;
  variantId: string | null;
  variantName?: string | null;
  addonOptionId: string | null;
  name: string;
  ingredients: RecipeIngredientLine[];
  estimatedCost: number;
  isActive: boolean;
  version: number;
  notes: string;
  preparationNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveRecipeInput = {
  id?: string;
  branchId?: string | null;
  menuItemId: string;
  variantId?: string | null;
  addonOptionId?: string | null;
  name?: string;
  ingredients: {
    ingredientId: string;
    quantity: number;
    unit: InventoryUnit;
    wastagePercentage?: number;
  }[];
  isActive?: boolean;
  notes?: string;
  preparationNotes?: string;
};

export type StockShortageItem = {
  ingredientId: string;
  ingredientName: string;
  requiredQuantity?: number;
  availableQuantity?: number;
  required?: number;
  available?: number;
  shortage?: number;
  unit: InventoryUnit;
};

export type StockShortageDetail = StockShortageItem;

export type InventoryConsumptionResult = {
  success: boolean;
  orderId?: string;
  deductedMovementsCount?: number;
  totalCost?: number;
  alreadyProcessed?: boolean;
  alreadyDeducted?: boolean;
  reason?: string;
  note?: string;
  deductions?: Array<{
    ingredientId: string;
    ingredientName: string;
    quantityDeducted: number;
    unit: string;
    stockBefore: number;
    stockAfter: number;
  }>;
  shortages?: StockShortageItem[];
  error?: string;
};

export type InventoryStockUpdatePlaceholder = Record<string, unknown>;

export type InventoryDashboardSummary = {
  totalIngredients: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  recentMovements: StockMovement[];
  lowStockIngredients: Ingredient[];
};

export type SearchInventoryParams = {
  branchId?: string;
  q?: string;
  category?: string;
  status?: "all" | StockStatus;
  active?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "currentStock" | "costPerUnit" | "updatedAt";
  sortOrder?: "asc" | "desc";
};

export type SaveRecipeIngredientInput = {
  ingredientId: string;
  quantity: number;
  unit: InventoryUnit;
  wastagePercentage?: number;
};

export type IngredientSummary = Ingredient;
export type IngredientDetail = Ingredient;
export type StockMovementSummary = StockMovement;
export type RecipeDetail = Recipe & { totalCost?: number };
export type StockOperationType = "PURCHASE" | "ADJUSTMENT_ADD" | "ADJUSTMENT_REMOVE" | "ADJUSTMENT_SET" | "WASTE";

