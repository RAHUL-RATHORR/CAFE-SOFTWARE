"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, Save, AlertCircle, Loader2, ChefHat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INVENTORY_UNITS } from "@/types/inventory";
import { convertUnit } from "@/lib/inventory/unit-converter";
import type {
  RecipeDetail,
  SaveRecipeInput,
  SaveRecipeIngredientInput,
  InventoryUnit,
} from "@/types/inventory";

interface RecipeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: SaveRecipeInput) => Promise<void>;
  menuItems: Array<{
    id: string;
    name: string;
    price: number;
    variants?: Array<{ id: string; name: string; price: number }>;
  }>;
  availableIngredients: Array<{
    id: string;
    name: string;
    unit: string;
    costPerUnit: number;
    currentStock: number;
  }>;
  existingRecipe?: RecipeDetail | null;
}

export function RecipeBuilderModal({
  isOpen,
  onClose,
  onSave,
  menuItems,
  availableIngredients,
  existingRecipe,
}: RecipeBuilderModalProps) {
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [lines, setLines] = useState<SaveRecipeIngredientInput[]>([]);
  const [preparationNotes, setPreparationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedMenuItem = useMemo(() => {
    return menuItems.find((m) => m.id === selectedMenuItemId) || null;
  }, [menuItems, selectedMenuItemId]);

  const selectedVariant = useMemo(() => {
    if (!selectedMenuItem || !selectedVariantId) return null;
    return selectedMenuItem.variants?.find((v) => v.id === selectedVariantId) || null;
  }, [selectedMenuItem, selectedVariantId]);

  const sellingPrice = selectedVariant ? selectedVariant.price : selectedMenuItem?.price || 0;

  // Initialize modal state
  useEffect(() => {
    if (existingRecipe) {
      setSelectedMenuItemId(existingRecipe.menuItemId || "");
      setSelectedVariantId(existingRecipe.variantId || "");
      setPreparationNotes(existingRecipe.preparationNotes || (existingRecipe as any).notes || "");
      setLines(
        (existingRecipe.ingredients || []).map((line) => ({
          ingredientId: line.ingredientId,
          quantity: line.quantity,
          unit: line.unit,
          wastagePercentage: line.wastagePercentage || 0,
        }))
      );
    } else {
      setSelectedMenuItemId(menuItems[0]?.id || "");
      setSelectedVariantId("");
      setPreparationNotes("");
      setLines([]);
    }
    setErrorMessage("");
  }, [existingRecipe, isOpen, menuItems]);

  if (!isOpen) return null;

  // Map ingredient details
  const ingredientMap = new Map(availableIngredients.map((i) => [i.id, i]));

  // Calculate line item costs
  const calculatedLines = lines.map((line) => {
    const ing = ingredientMap.get(line.ingredientId);
    let lineCost = 0;
    if (ing) {
      try {
        const effectiveQty = line.quantity * (1 + (line.wastagePercentage || 0) / 100);
        const normalizedQty = convertUnit(
          effectiveQty,
          line.unit as InventoryUnit,
          ing.unit as InventoryUnit
        );
        lineCost = Math.round(normalizedQty * (ing.costPerUnit || 0) * 100) / 100;
      } catch {
        lineCost = 0;
      }
    }
    return {
      ...line,
      ingredientName: ing?.name || "Unknown",
      baseUnit: ing?.unit || line.unit,
      costPerUnit: ing?.costPerUnit || 0,
      lineCost,
    };
  });

  const totalBomCost = calculatedLines.reduce((sum, l) => sum + l.lineCost, 0);
  const foodCostPercentage = sellingPrice > 0 ? (totalBomCost / sellingPrice) * 100 : 0;

  const handleAddLine = () => {
    // Pick first available ingredient that isn't already added
    const usedIds = new Set(lines.map((l) => l.ingredientId));
    const firstUnused = availableIngredients.find((i) => !usedIds.has(i.id)) || availableIngredients[0];
    if (!firstUnused) return;

    setLines([
      ...lines,
      {
        ingredientId: firstUnused.id,
        quantity: 1,
        unit: firstUnused.unit as InventoryUnit,
        wastagePercentage: 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof SaveRecipeIngredientInput, value: any) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, [field]: value };
        // If ingredient changed, default unit to that ingredient's base unit
        if (field === "ingredientId") {
          const ing = ingredientMap.get(value);
          if (ing) updated.unit = ing.unit as InventoryUnit;
        }
        return updated;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItemId) {
      setErrorMessage("Please select a menu item.");
      return;
    }
    if (lines.length === 0) {
      setErrorMessage("Please add at least one ingredient line to the recipe BOM.");
      return;
    }

    // Check duplicate ingredients
    const idSet = new Set<string>();
    for (const l of lines) {
      if (idSet.has(l.ingredientId)) {
        setErrorMessage("Recipe contains duplicate ingredients. Please consolidate quantities into a single line.");
        return;
      }
      idSet.add(l.ingredientId);
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await onSave({
        id: existingRecipe?.id,
        menuItemId: selectedMenuItemId,
        variantId: selectedVariantId || undefined,
        ingredients: lines.map((l) => ({
          ingredientId: l.ingredientId,
          quantity: Number(l.quantity) || 0,
          unit: l.unit,
          wastagePercentage: Number(l.wastagePercentage) || 0,
        })),
        preparationNotes: preparationNotes.trim() || undefined,
      });

      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save recipe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {existingRecipe ? "Edit Recipe BOM" : "Recipe Builder & BOM"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define raw ingredient composition & calculate food cost %
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Menu Item & Variant Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Menu Item *
              </Label>
              <select
                value={selectedMenuItemId}
                onChange={(e) => {
                  setSelectedMenuItemId(e.target.value);
                  setSelectedVariantId("");
                }}
                disabled={Boolean(existingRecipe)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              >
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (₹{item.price})
                  </option>
                ))}
              </select>
            </div>

            {selectedMenuItem?.variants && selectedMenuItem.variants.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Variant (Optional)
                </Label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  disabled={Boolean(existingRecipe)}
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                >
                  <option value="">Base Recipe (All Variants)</option>
                  {selectedMenuItem.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (₹{v.price})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Financial Overview Card */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-muted/40 border border-border/60">
            <div>
              <p className="text-xs text-muted-foreground">Selling Price</p>
              <p className="text-base font-bold text-foreground">₹{sellingPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total BOM Cost</p>
              <p className="text-base font-bold text-blue-500">₹{totalBomCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Food Cost %</p>
              <div className="flex items-center gap-1.5">
                <p
                  className={`text-base font-bold ${
                    foodCostPercentage > 45
                      ? "text-rose-500"
                      : foodCostPercentage > 35
                      ? "text-amber-500"
                      : "text-emerald-500"
                  }`}
                >
                  {foodCostPercentage.toFixed(1)}%
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                  {foodCostPercentage <= 35 ? "Optimal" : foodCostPercentage <= 45 ? "Moderate" : "High"}
                </span>
              </div>
            </div>
          </div>

          {/* Ingredient Lines Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bill of Materials (BOM Ingredients)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="h-8 rounded-lg text-xs flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Ingredient Line
              </Button>
            </div>

            {calculatedLines.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                <ChefHat className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No ingredients added yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click &apos;Add Ingredient Line&apos; to build the recipe for this menu item
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {calculatedLines.map((line, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border border-border/80 bg-background hover:border-primary/30 transition-colors"
                  >
                    {/* Ingredient dropdown */}
                    <div className="col-span-4">
                      <select
                        value={line.ingredientId}
                        onChange={(e) => handleLineChange(index, "ingredientId", e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {availableIngredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} (₹{ing.costPerUnit}/{ing.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) =>
                          handleLineChange(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="h-9 text-xs rounded-lg px-2"
                      />
                    </div>

                    {/* Unit */}
                    <div className="col-span-2">
                      <select
                        value={line.unit}
                        onChange={(e) => handleLineChange(index, "unit", e.target.value)}
                        className="w-full h-9 px-2 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {INVENTORY_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Wastage % */}
                    <div className="col-span-2">
                      <div className="relative">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          placeholder="Waste %"
                          value={line.wastagePercentage}
                          onChange={(e) =>
                            handleLineChange(index, "wastagePercentage", parseFloat(e.target.value) || 0)
                          }
                          className="h-9 text-xs rounded-lg px-2 pr-6"
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground">%</span>
                      </div>
                    </div>

                    {/* Calculated Line Cost */}
                    <div className="col-span-1 text-right">
                      <span className="text-xs font-semibold text-foreground">
                        ₹{line.lineCost.toFixed(1)}
                      </span>
                    </div>

                    {/* Remove button */}
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preparation Notes */}
          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preparation / Recipe Notes
            </Label>
            <Input
              placeholder="e.g., Grind 18g double shot, steam milk to 65C"
              value={preparationNotes}
              onChange={(e) => setPreparationNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary text-primary-foreground flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Recipe...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Recipe BOM
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
