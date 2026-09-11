import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/database";
import { resolveInventoryActor } from "@/actions/inventory/context";
import {
  getInventoryDashboard,
  listIngredients,
  listStockMovements,
  listRecipes,
} from "@/actions/inventory";
import { InventoryDashboardShell } from "@/components/inventory";
import { BranchModel } from "@/models/branch";
import { MenuItemModel } from "@/models/menu-item";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

interface InventoryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedBranchId = typeof resolvedSearchParams.branchId === "string" ? resolvedSearchParams.branchId : undefined;

  const actorRes = await resolveInventoryActor("inventory.view", requestedBranchId);

  if (!actorRes.success) {
    if (actorRes.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    if (actorRes.code === "FORBIDDEN") {
      return <AuthError code="forbidden" />;
    }
  }

  const actor = actorRes.success ? actorRes.data : null;
  const restaurantId = actor?.restaurantId || "";

  await connectToDatabase();

  // Fetch branches for restaurant
  const branchDocs = await BranchModel.find({
    restaurantId,
    isDeleted: { $ne: true },
  })
    .select({ _id: 1, name: 1 })
    .lean();

  const branches = branchDocs.map((b) => ({
    id: b._id.toString(),
    name: b.name,
  }));

  const activeBranchId = actor?.branchId || branches[0]?.id || "";

  // Fetch dashboard summary, ingredients, movements, recipes, and menu items
  const [dashboardRes, ingredientsRes, movementsRes, recipesRes, menuDocs] = await Promise.all([
    getInventoryDashboard(activeBranchId),
    listIngredients({ page: 1, limit: 100 }, activeBranchId),
    listStockMovements({ limit: 50 }, activeBranchId),
    listRecipes({ limit: 100 }, activeBranchId),
    MenuItemModel.find({
      restaurantId,
      isDeleted: { $ne: true },
    })
      .select({ _id: 1, name: 1, price: 1, variants: 1 })
      .lean(),
  ]);

  const summary = dashboardRes.success && dashboardRes.data?.summary
    ? dashboardRes.data.summary
    : {
        totalIngredients: 0,
        totalStockValuation: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        negativeStockCount: 0,
      };

  const ingredients = ingredientsRes.success ? ingredientsRes.data.ingredients : [];
  const movements = movementsRes.success ? movementsRes.data.movements : [];
  const recipes = recipesRes.success ? recipesRes.data.recipes : [];

  const menuItems = menuDocs.map((m: any) => ({
    id: m._id.toString(),
    name: m.name,
    price: m.price || 0,
    variants: (m.variants || []).map((v: any) => ({
      id: v._id?.toString() || v.name,
      name: v.name,
      price: v.price || 0,
    })),
  }));

  return (
    <InventoryDashboardShell
      initialBranchId={activeBranchId}
      branches={branches}
      canSwitchBranch={actor?.canSwitchBranch ?? false}
      initialSummary={summary}
      initialIngredients={ingredients}
      initialMovements={movements}
      initialRecipes={recipes}
      menuItems={menuItems}
    />
  );
}
