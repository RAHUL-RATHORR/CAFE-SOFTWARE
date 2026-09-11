"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INVENTORY_UNITS, INVENTORY_CATEGORIES } from "@/types/inventory";
import type {
  IngredientDetail,
  CreateIngredientInput,
  UpdateIngredientInput,
  InventoryUnit,
} from "@/types/inventory";

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateIngredientInput | (UpdateIngredientInput & { id: string })) => Promise<void>;
  initialData?: IngredientDetail | null;
}

export function IngredientModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: IngredientModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Dry Goods");
  const [unit, setUnit] = useState<InventoryUnit>("kg");
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [minimumStock, setMinimumStock] = useState<number>(5);
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [storageLocation, setStorageLocation] = useState("");
  const [allowNegativeStock, setAllowNegativeStock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEdit = Boolean(initialData?.id);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCategory(initialData.category || "Dry Goods");
      setUnit(initialData.unit || "kg");
      setCostPerUnit(initialData.costPerUnit || 0);
      setMinimumStock(initialData.minimumStock || 5);
      setReorderLevel(initialData.reorderLevel || 10);
      setStorageLocation(initialData.storageLocation || "");
      setAllowNegativeStock(initialData.allowNegativeStock ?? true);
      setInitialStock(initialData.currentStock || 0);
    } else {
      setName("");
      setCategory("Dry Goods");
      setUnit("kg");
      setCostPerUnit(0);
      setInitialStock(0);
      setMinimumStock(5);
      setReorderLevel(10);
      setStorageLocation("");
      setAllowNegativeStock(true);
    }
    setErrorMessage("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Ingredient name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      if (isEdit && initialData?.id) {
        await onSave({
          id: initialData.id,
          name: name.trim(),
          category: category.trim(),
          unit,
          costPerUnit: Number(costPerUnit) || 0,
          minimumStock: Number(minimumStock) || 0,
          reorderLevel: Number(reorderLevel) || 0,
          storageLocation: storageLocation.trim(),
          allowNegativeStock,
        });
      } else {
        await onSave({
          name: name.trim(),
          category: category.trim(),
          unit,
          costPerUnit: Number(costPerUnit) || 0,
          initialStock: Number(initialStock) || 0,
          minimumStock: Number(minimumStock) || 0,
          reorderLevel: Number(reorderLevel) || 0,
          storageLocation: storageLocation.trim(),
          allowNegativeStock,
        });
      }

      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save ingredient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {isEdit ? "Edit Ingredient" : "Add New Ingredient"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? "Update inventory tracking and threshold parameters"
                : "Create raw ingredient and track stock in your branch"}
            </p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ing-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ingredient Name *
            </Label>
            <Input
              id="ing-name"
              placeholder="e.g., Whole Milk, Espresso Beans, Olive Oil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {INVENTORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Base Unit *
              </Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as InventoryUnit)}
                disabled={isEdit}
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {INVENTORY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ing-cost" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cost per Unit (₹)
              </Label>
              <Input
                id="ing-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                className="rounded-xl"
              />
            </div>

            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="ing-initial" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Initial Opening Stock
                </Label>
                <Input
                  id="ing-initial"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(parseFloat(e.target.value) || 0)}
                  className="rounded-xl"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ing-min" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Minimum Stock
              </Label>
              <Input
                id="ing-min"
                type="number"
                step="0.001"
                min="0"
                value={minimumStock}
                onChange={(e) => setMinimumStock(parseFloat(e.target.value) || 0)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ing-reorder" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reorder Level
              </Label>
              <Input
                id="ing-reorder"
                type="number"
                step="0.001"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(parseFloat(e.target.value) || 0)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ing-location" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Storage Location / Shelf
            </Label>
            <Input
              id="ing-location"
              placeholder="e.g., Walk-in Cooler A, Shelf 2B"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60">
            <div>
              <p className="text-sm font-medium text-foreground">Allow Negative Stock</p>
              <p className="text-xs text-muted-foreground">
                Allows orders to process even if stock is low or untracked
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowNegativeStock}
              onChange={(e) => setAllowNegativeStock(e.target.checked)}
              className="h-5 w-5 rounded border-input accent-primary cursor-pointer"
            />
          </div>

          {/* Actions */}
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? "Update Ingredient" : "Create Ingredient"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
