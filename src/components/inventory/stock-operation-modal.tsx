"use client";

import { useState, useEffect } from "react";
import { X, ArrowDownRight, ArrowUpRight, Sliders, Trash2, ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertUnit } from "@/lib/inventory/unit-converter";
import type { IngredientSummary, StockOperationType, InventoryUnit } from "@/types/inventory";

interface StockOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: IngredientSummary | null;
  onConfirm: (payload: {
    ingredientId: string;
    type: StockOperationType;
    quantity: number;
    unit?: string;
    costPerUnit?: number;
    notes?: string;
  }) => Promise<void>;
}

export function StockOperationModal({
  isOpen,
  onClose,
  ingredient,
  onConfirm,
}: StockOperationModalProps) {
  const [opType, setOpType] = useState<StockOperationType>("PURCHASE");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<InventoryUnit>("kg");
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (ingredient) {
      setUnit(ingredient.unit);
      setCostPerUnit(ingredient.costPerUnit || 0);
      setQuantity(1);
      setNotes("");
      setOpType("PURCHASE");
    }
    setErrorMessage("");
  }, [ingredient, isOpen]);

  if (!isOpen || !ingredient) return null;

  // Calculate projected stock
  let projectedStock = ingredient.currentStock;
  try {
    const normalizedQty = convertUnit(Number(quantity) || 0, unit, ingredient.unit);
    if (opType === "PURCHASE" || opType === "ADJUSTMENT_ADD") {
      projectedStock = ingredient.currentStock + normalizedQty;
    } else if (opType === "ADJUSTMENT_REMOVE" || opType === "WASTE") {
      projectedStock = ingredient.currentStock - normalizedQty;
    } else if (opType === "ADJUSTMENT_SET") {
      projectedStock = normalizedQty;
    }
    projectedStock = Math.round(projectedStock * 1000) / 1000;
  } catch {
    // Incompatible unit
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 && opType !== "ADJUSTMENT_SET") {
      setErrorMessage("Quantity must be greater than 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await onConfirm({
        ingredientId: ingredient.id,
        type: opType,
        quantity: Number(quantity) || 0,
        unit,
        costPerUnit: opType === "PURCHASE" ? Number(costPerUnit) || 0 : undefined,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to record stock movement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Stock Movement</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adjust or restock: <span className="font-semibold text-foreground">{ingredient.name}</span>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Operation Type Selector Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Operation Type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOpType("PURCHASE")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  opType === "PURCHASE"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 font-semibold"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <ShoppingCart className="h-4 w-4 mb-1" />
                Purchase
              </button>
              <button
                type="button"
                onClick={() => setOpType("ADJUSTMENT_ADD")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  opType === "ADJUSTMENT_ADD"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-500 font-semibold"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <ArrowUpRight className="h-4 w-4 mb-1" />
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setOpType("ADJUSTMENT_REMOVE")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  opType === "ADJUSTMENT_REMOVE"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-500 font-semibold"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <ArrowDownRight className="h-4 w-4 mb-1" />
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpType("ADJUSTMENT_SET")}
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                  opType === "ADJUSTMENT_SET"
                    ? "border-purple-500/50 bg-purple-500/10 text-purple-500 font-semibold"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Audit Physical Count
              </button>
              <button
                type="button"
                onClick={() => setOpType("WASTE")}
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                  opType === "WASTE"
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-500 font-semibold"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Wastage / Spoilage
              </button>
            </div>
          </div>

          {/* Current vs Projected Stock Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
            <div>
              <p className="text-xs text-muted-foreground">Current Stock</p>
              <p className="text-sm font-semibold text-foreground">
                {ingredient.currentStock} {ingredient.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Projected Stock</p>
              <p
                className={`text-sm font-bold ${
                  projectedStock < 0
                    ? "text-rose-500"
                    : projectedStock <= (ingredient.minimumStock || 0)
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              >
                {projectedStock} {ingredient.unit}
              </p>
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {opType === "ADJUSTMENT_SET" ? "New Exact Stock *" : "Quantity *"}
              </Label>
              <Input
                type="number"
                step="0.001"
                min={opType === "ADJUSTMENT_SET" ? "0" : "0.001"}
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Unit
              </Label>
              <Input
                value={unit}
                disabled
                className="rounded-xl bg-muted/50 opacity-80"
              />
            </div>
          </div>

          {/* Cost per unit (visible for purchase) */}
          {opType === "PURCHASE" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Purchase Cost per {ingredient.unit} (₹)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Total Purchase Cost: ₹{Math.round((Number(quantity) || 0) * (Number(costPerUnit) || 0) * 100) / 100}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reason / Notes
            </Label>
            <Input
              placeholder="e.g., Weekly supplier batch, expired batch, physical audit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl"
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
                  Updating...
                </>
              ) : (
                "Confirm Movement"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
