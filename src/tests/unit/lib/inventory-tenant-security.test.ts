import { describe, expect, it, vi, beforeEach } from "vitest";
import { ingredientRepository } from "@/repositories/inventory/ingredient.repository";
import { recipeRepository } from "@/repositories/inventory/recipe.repository";
import { stockMovementRepository } from "@/repositories/inventory/stock-movement.repository";
import { IngredientModel, RecipeModel, StockMovementModel } from "@/models/inventory";

vi.mock("@/lib/database", async () => {
  const actual = await vi.importActual<any>("@/lib/database");
  return {
    ...actual,
    connectToDatabase: vi.fn().mockResolvedValue(true),
  };
});

vi.mock("@/models/inventory", () => {
  return {
    IngredientModel: {
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      findOneAndUpdate: vi.fn(),
      countDocuments: vi.fn(),
    },
    StockMovementModel: {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      countDocuments: vi.fn(),
    },
    RecipeModel: {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      findOneAndUpdate: vi.fn(),
      countDocuments: vi.fn(),
    },
  };
});

describe("Inventory Multi-Tenant & Branch Boundary Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strictly scopes ingredient listing by restaurantId and branchId", async () => {
    const mockFind = vi.mocked(IngredientModel.find);
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    } as any);

    vi.mocked(IngredientModel.countDocuments).mockResolvedValue(0 as any);

    const restId = "507f1f77bcf86cd799439011";
    const branchId = "507f1f77bcf86cd799439022";

    await ingredientRepository.listIngredients(restId, { branchId, page: 1, pageSize: 10 });

    expect(mockFind).toHaveBeenCalled();
    const filterArg = mockFind.mock.calls[0][0] as any;
    expect(filterArg.restaurantId.toString()).toBe(restId);
    expect(filterArg.branchId.toString()).toBe(branchId);
    expect(filterArg.isDeleted).toBe(false);
  });

  it("strictly scopes recipe lookups by restaurantId and branchId", async () => {
    const mockFindOne = vi.mocked(RecipeModel.findOne);
    mockFindOne.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(null),
    } as any);

    const restId = "507f1f77bcf86cd799439011";
    const branchId = "507f1f77bcf86cd799439022";
    const menuItemId = "507f1f77bcf86cd799439033";

    await recipeRepository.getRecipeByMenuItem(restId, branchId, menuItemId);

    expect(mockFindOne).toHaveBeenCalled();
    const filterArg = mockFindOne.mock.calls[0][0] as any;
    expect(filterArg.restaurantId.toString()).toBe(restId);
    expect(filterArg.branchId.toString()).toBe(branchId);
    expect(filterArg.menuItemId.toString()).toBe(menuItemId);
    expect(filterArg.isActive).toBe(true);
  });

  it("strictly scopes stock movements ledger by restaurantId and branchId", async () => {
    const mockFind = vi.mocked(StockMovementModel.find);
    mockFind.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    } as any);

    vi.mocked(StockMovementModel.countDocuments).mockResolvedValue(0 as any);

    const restId = "507f1f77bcf86cd799439011";
    const branchId = "507f1f77bcf86cd799439022";

    await stockMovementRepository.listMovements(restId, { branchId, page: 1, pageSize: 20 });

    expect(mockFind).toHaveBeenCalled();
    const filterArg = mockFind.mock.calls[0][0] as any;
    expect(filterArg.restaurantId.toString()).toBe(restId);
    expect(filterArg.branchId.toString()).toBe(branchId);
  });
});
