import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryConsumptionService } from "@/lib/inventory/inventory-consumption-service";
import { StockMovementModel, IngredientModel, RecipeModel } from "@/models/inventory";

// Mock database connection
vi.mock("@/lib/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/database")>();
  return {
    ...actual,
    connectToDatabase: vi.fn().mockResolvedValue(true),
  };
});

// Mock models
vi.mock("@/models/inventory", () => ({
  StockMovementModel: {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
  },
  IngredientModel: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
  RecipeModel: {
    find: vi.fn(),
    findOne: vi.fn(),
  },
}));

describe("Inventory Consumption Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Idempotency", () => {
    it("returns immediately without deduction if referenceKey already exists in ledger", async () => {
      // Setup mock to return existing movement
      vi.mocked(StockMovementModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "existing_mov_id",
          referenceKey: "ORDER_CONSUMPTION:order_123",
        }),
      } as any);

      const result = await InventoryConsumptionService.deductOrderStock(
        "rest_1",
        "branch_1",
        "order_123",
        [{ menuItemId: "item_1", quantity: 2 }]
      );

      expect(result.success).toBe(true);
      expect(result.alreadyDeducted).toBe(true);
      // Ensure no updates were attempted
      expect(IngredientModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(StockMovementModel.create).not.toHaveBeenCalled();
    });

    it("returns alreadyReversed if reversal referenceKey already exists in ledger", async () => {
      vi.mocked(StockMovementModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "existing_rev_id",
          referenceKey: "ORDER_REVERSAL:order_123",
        }),
      } as any);

      const result = await InventoryConsumptionService.reverseOrderStock(
        "rest_1",
        "branch_1",
        "order_123"
      );

      expect(result.success).toBe(true);
      expect(result.alreadyReversed).toBe(true);
      expect(IngredientModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Shortage and Negative Stock Policy", () => {
    it("blocks deduction entirely without writing partial movements if shortage exists and blocking is enabled", async () => {
      // Mock no prior deduction
      vi.mocked(StockMovementModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      // Mock recipe requiring 2kg of ingredient_1
      vi.mocked(RecipeModel.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            menuItemId: "item_1",
            isActive: true,
            ingredients: [
              {
                ingredientId: "507f1f77bcf86cd799439011",
                quantity: 1, // 1kg per item * 2 items = 2kg
                unit: "kg",
                wastagePercentage: 0,
              },
            ],
          },
        ]),
      } as any);

      // Mock ingredient has only 0.5kg available and allowNegativeStock is FALSE
      vi.mocked(IngredientModel.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: "507f1f77bcf86cd799439011",
            name: "Premium Mozzarella",
            unit: "kg",
            currentStock: 0.5,
            costPerUnit: 500,
            allowNegativeStock: false,
          },
        ]),
      } as any);

      const result = await InventoryConsumptionService.deductOrderStock(
        "rest_1",
        "branch_1",
        "order_shortage",
        [{ menuItemId: "item_1", quantity: 2 }],
        { blockIfInsufficientStock: true }
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("INSUFFICIENT_STOCK");
      expect(result.shortages).toHaveLength(1);
      expect(result.shortages![0].ingredientName).toBe("Premium Mozzarella");
      expect(result.shortages![0].shortage).toBe(1.5); // 2 - 0.5 = 1.5kg

      // Crucial: No partial stock deduction applied to database!
      expect(IngredientModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(StockMovementModel.create).not.toHaveBeenCalled();
    });
  });
});
