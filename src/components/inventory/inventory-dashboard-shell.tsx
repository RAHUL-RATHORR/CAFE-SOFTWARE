"use client";

import { useState, useTransition } from "react";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sliders,
  History,
  Edit2,
  Trash2,
  ChefHat,
  Receipt,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveIngredient,
  deleteIngredient,
  recordStockOperation,
  saveRecipe,
  deleteRecipe,
} from "@/actions/inventory";
import { IngredientModal } from "./ingredient-modal";
import { StockOperationModal } from "./stock-operation-modal";
import { RecipeBuilderModal } from "./recipe-builder-modal";
import { IngredientHistoryModal } from "./ingredient-history-modal";
import { INVENTORY_CATEGORIES } from "@/types/inventory";
import type {
  IngredientSummary,
  IngredientDetail,
  StockMovementSummary,
  RecipeDetail,
  CreateIngredientInput,
  UpdateIngredientInput,
  StockOperationType,
  SaveRecipeInput,
} from "@/types/inventory";

interface InventoryDashboardShellProps {
  initialBranchId: string;
  branches: Array<{ id: string; name: string }>;
  canSwitchBranch: boolean;
  initialSummary: {
    totalIngredients: number;
    totalStockValuation: number;
    lowStockCount: number;
    outOfStockCount: number;
    negativeStockCount: number;
  };
  initialIngredients: IngredientSummary[];
  initialMovements: StockMovementSummary[];
  initialRecipes: RecipeDetail[];
  menuItems: Array<{
    id: string;
    name: string;
    price: number;
    variants?: Array<{ id: string; name: string; price: number }>;
  }>;
}

export function InventoryDashboardShell({
  initialBranchId,
  branches,
  canSwitchBranch,
  initialSummary,
  initialIngredients,
  initialMovements,
  initialRecipes,
  menuItems,
}: InventoryDashboardShellProps) {
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId);
  const [activeTab, setActiveTab] = useState<"ingredients" | "movements" | "recipes">("ingredients");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  // Local state for interactive updates
  const [ingredients, setIngredients] = useState<IngredientSummary[]>(initialIngredients);
  const [movements, setMovements] = useState<StockMovementSummary[]>(initialMovements);
  const [recipes, setRecipes] = useState<RecipeDetail[]>(initialRecipes);
  const [summary, setSummary] = useState(initialSummary);

  // Modals state
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientDetail | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedIngredientForStock, setSelectedIngredientForStock] = useState<IngredientSummary | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedIngredientForHistory, setSelectedIngredientForHistory] = useState<IngredientSummary | null>(null);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeDetail | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || item.stockStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handlers
  const handleSaveIngredient = async (
    data: CreateIngredientInput | (UpdateIngredientInput & { id: string })
  ) => {
    const res = await saveIngredient(data, selectedBranchId);
    if (!res.success) {
      throw new Error(res.error);
    }
    // Optimistic / server refresh:
    window.location.reload();
  };

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ingredient?")) return;
    const res = await deleteIngredient(id, selectedBranchId);
    if (!res.success) {
      alert(res.error);
      return;
    }
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const handleStockOperation = async (payload: {
    ingredientId: string;
    type: StockOperationType;
    quantity: number;
    unit?: string;
    costPerUnit?: number;
    notes?: string;
  }) => {
    const res = await recordStockOperation(payload, selectedBranchId);
    if (!res.success) {
      throw new Error(res.error);
    }
    window.location.reload();
  };

  const handleSaveRecipe = async (payload: SaveRecipeInput) => {
    const res = await saveRecipe(payload, selectedBranchId);
    if (!res.success) {
      throw new Error(res.error);
    }
    window.location.reload();
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe BOM?")) return;
    const res = await deleteRecipe(id, selectedBranchId);
    if (!res.success) {
      alert(res.error);
      return;
    }
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Inventory & Recipe Management
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time stock tracking, bill of materials (BOM), & automatic order deduction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Branch Switcher */}
            {canSwitchBranch && branches.length > 0 && (
              <div className="flex items-center gap-1.5 bg-muted/50 border border-border px-3 py-1.5 rounded-xl text-xs font-medium">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    window.location.href = `/inventory?branchId=${e.target.value}`;
                  }}
                  className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-card text-foreground">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <Button
              onClick={() => {
                setEditingIngredient(null);
                setIsIngredientModalOpen(true);
              }}
              className="rounded-xl bg-primary text-primary-foreground flex items-center gap-1.5 text-xs font-semibold shadow-sm hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              Add Ingredient
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setEditingRecipe(null);
                setIsRecipeModalOpen(true);
              }}
              className="rounded-xl border-border flex items-center gap-1.5 text-xs font-semibold hover:bg-muted"
            >
              <ChefHat className="h-4 w-4 text-primary" />
              Build Recipe BOM
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Valuation */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stock Valuation
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground mt-3">
              ₹{summary.totalStockValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Active inventory asset value
            </p>
          </div>

          {/* Tracked Ingredients */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tracked Ingredients
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground mt-3">
              {summary.totalIngredients}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across all categories
            </p>
          </div>

          {/* Low Stock Items */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Low Stock Alerts
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className={`text-2xl font-black mt-3 ${summary.lowStockCount > 0 ? "text-amber-500" : "text-foreground"}`}>
              {summary.lowStockCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Below reorder threshold
            </p>
          </div>

          {/* Out of Stock */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Out of Stock
              </span>
              <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <p className={`text-2xl font-black mt-3 ${summary.outOfStockCount > 0 ? "text-rose-500" : "text-foreground"}`}>
              {summary.outOfStockCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Immediate restocking needed
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab("ingredients")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "ingredients"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Boxes className="h-4 w-4" />
            Ingredients & Stock ({ingredients.length})
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "movements"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4" />
            Movement Ledger ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab("recipes")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "recipes"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            Recipes & Costing BOM ({recipes.length})
          </button>
        </div>

        {/* TAB 1: INGREDIENTS */}
        {activeTab === "ingredients" && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ingredient by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl bg-card border-border text-xs h-9"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {INVENTORY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Status Filter Chips */}
                <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border text-xs">
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      statusFilter === "ALL"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("IN_STOCK")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      statusFilter === "IN_STOCK"
                        ? "bg-emerald-500/15 text-emerald-500 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    In Stock
                  </button>
                  <button
                    onClick={() => setStatusFilter("LOW_STOCK")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      statusFilter === "LOW_STOCK"
                        ? "bg-amber-500/15 text-amber-500 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Low Stock
                  </button>
                  <button
                    onClick={() => setStatusFilter("OUT_OF_STOCK")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      statusFilter === "OUT_OF_STOCK"
                        ? "bg-rose-500/15 text-rose-500 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Out of Stock
                  </button>
                </div>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Ingredient</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Stock Level</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Cost / Unit</th>
                      <th className="px-4 py-3.5">Total Value</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredIngredients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                          <Boxes className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-medium">No ingredients match your filter.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredIngredients.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                          {/* Name */}
                          <td className="px-5 py-3.5 font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{item.name}</span>
                              {item.allowNegativeStock && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                  Neg OK
                                </span>
                              )}
                            </div>
                            {item.storageLocation && (
                              <p className="text-[11px] text-muted-foreground">
                                Loc: {item.storageLocation}
                              </p>
                            )}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3.5 text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium">
                              {item.category}
                            </span>
                          </td>

                          {/* Current Stock */}
                          <td className="px-4 py-3.5 font-semibold text-foreground">
                            <span className="text-sm">{item.currentStock}</span>{" "}
                            <span className="text-xs text-muted-foreground">{item.unit}</span>
                            <p className="text-[10px] text-muted-foreground font-normal">
                              Min: {item.minimumStock} • Reorder: {item.reorderLevel}
                            </p>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3.5">
                            {item.stockStatus === "IN_STOCK" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" /> In Stock
                              </span>
                            )}
                            {item.stockStatus === "LOW_STOCK" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <AlertTriangle className="h-3 w-3" /> Low Stock
                              </span>
                            )}
                            {item.stockStatus === "OUT_OF_STOCK" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                <TrendingDown className="h-3 w-3" /> Out of Stock
                              </span>
                            )}
                          </td>

                          {/* Cost per unit */}
                          <td className="px-4 py-3.5 text-muted-foreground">
                            ₹{item.costPerUnit.toFixed(2)} / {item.unit}
                          </td>

                          {/* Total Value */}
                          <td className="px-4 py-3.5 font-semibold text-foreground">
                            ₹{(item.totalValuation ?? (item.currentStock * item.costPerUnit)).toFixed(2)}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                              {/* Quick Stock Movement */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedIngredientForStock(item);
                                  setIsStockModalOpen(true);
                                }}
                                className="h-7 px-2 text-[11px] rounded-lg border-border hover:border-primary/50 text-foreground"
                              >
                                <Sliders className="h-3 w-3 mr-1 text-primary" />
                                Stock In/Out
                              </Button>

                              {/* Ledger History */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedIngredientForHistory(item);
                                  setIsHistoryModalOpen(true);
                                }}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Audit Ledger History"
                              >
                                <History className="h-3.5 w-3.5" />
                              </Button>

                              {/* Edit */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingIngredient(item as any);
                                  setIsIngredientModalOpen(true);
                                }}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Edit Ingredient"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              {/* Delete */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteIngredient(item.id)}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Delete Ingredient"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STOCK LEDGER */}
        {activeTab === "movements" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Immutable Stock Ledger</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Chronological audit trail of purchases, recipe consumptions, reversals, and adjustments
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-4 py-3.5">Ingredient</th>
                      <th className="px-4 py-3.5">Type</th>
                      <th className="px-4 py-3.5">Quantity Change</th>
                      <th className="px-4 py-3.5">Stock Shift</th>
                      <th className="px-4 py-3.5">Reference / Key</th>
                      <th className="px-5 py-3.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {movements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                          <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-medium">No stock movements recorded yet.</p>
                        </td>
                      </tr>
                    ) : (
                      movements.map((mov) => (
                        <tr key={mov.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {new Date(mov.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-foreground">
                            {mov.ingredientName || "Ingredient"}
                          </td>
                          <td className="px-4 py-3.5">
                            {mov.movementType === "PURCHASE" && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Purchase
                              </span>
                            )}
                            {mov.movementType === "CONSUMPTION" && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                Consumption
                              </span>
                            )}
                            {mov.movementType === "REVERSAL" && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Reversal
                              </span>
                            )}
                            {mov.movementType.startsWith("ADJUSTMENT") && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                Adjustment
                              </span>
                            )}
                            {mov.movementType === "WASTE" && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                Waste
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-foreground">
                            {mov.movementType === "CONSUMPTION" || mov.movementType === "ADJUSTMENT_REMOVE" || mov.movementType === "WASTE"
                              ? "-"
                              : "+"}
                            {mov.quantity} {mov.unit}
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            {mov.beforeStock ?? mov.stockBefore ?? 0} &rarr; <span className="font-semibold text-foreground">{mov.afterStock ?? mov.stockAfter ?? 0} {mov.unit}</span>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]">
                            {mov.referenceKey || mov.referenceId || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {mov.notes || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RECIPES & BOM */}
        {activeTab === "recipes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Configured Recipes & Bill of Materials</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Items with recipes automatically deduct ingredient stock upon order confirmation
                </p>
              </div>

              <Button
                onClick={() => {
                  setEditingRecipe(null);
                  setIsRecipeModalOpen(true);
                }}
                className="rounded-xl bg-primary text-primary-foreground flex items-center gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add Recipe BOM
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.length === 0 ? (
                <div className="col-span-full text-center py-16 border-2 border-dashed border-border rounded-2xl bg-card">
                  <ChefHat className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-base font-semibold text-foreground">No Recipes Created Yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Create recipes to connect menu items to raw ingredients for automatic stock deduction and live food costing.
                  </p>
                  <Button
                    onClick={() => {
                      setEditingRecipe(null);
                      setIsRecipeModalOpen(true);
                    }}
                    className="mt-4 rounded-xl text-xs"
                  >
                    Build First Recipe
                  </Button>
                </div>
              ) : (
                recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-foreground text-sm">
                            {recipe.menuItemName || "Menu Item"}
                          </h4>
                          {recipe.variantName && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                              Variant: {recipe.variantName}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">BOM Cost</span>
                          <p className="text-sm font-bold text-blue-500">
                            ₹{(recipe.totalCost ?? recipe.estimatedCost ?? 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Ingredients breakdown list */}
                      <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Ingredients ({recipe.ingredients.length})
                        </span>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {recipe.ingredients.map((line, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0"
                            >
                              <span className="text-muted-foreground">
                                {line.ingredientName || "Ingredient"}
                              </span>
                              <div className="text-right">
                                <span className="font-medium text-foreground">
                                  {line.quantity} {line.unit}
                                </span>
                                {line.wastagePercentage > 0 && (
                                  <span className="text-[10px] text-muted-foreground ml-1">
                                    (+{line.wastagePercentage}% waste)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRecipe(recipe);
                          setIsRecipeModalOpen(true);
                        }}
                        className="h-7 px-2 text-xs rounded-lg border-border hover:bg-muted"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit BOM
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <IngredientModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        onSave={handleSaveIngredient}
        initialData={editingIngredient}
      />

      <StockOperationModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        ingredient={selectedIngredientForStock}
        onConfirm={handleStockOperation}
      />

      <IngredientHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        ingredient={selectedIngredientForHistory}
        branchId={selectedBranchId}
      />

      <RecipeBuilderModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        onSave={handleSaveRecipe}
        menuItems={menuItems}
        availableIngredients={ingredients}
        existingRecipe={editingRecipe}
      />
    </div>
  );
}
