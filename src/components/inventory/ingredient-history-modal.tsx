"use client";

import { useState, useEffect } from "react";
import { X, History, Loader2, ArrowUpRight, ArrowDownRight, RefreshCcw, AlertTriangle, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listStockMovements } from "@/actions/inventory";
import type { StockMovementSummary, IngredientSummary } from "@/types/inventory";

interface IngredientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: IngredientSummary | null;
  branchId?: string;
}

export function IngredientHistoryModal({
  isOpen,
  onClose,
  ingredient,
  branchId,
}: IngredientHistoryModalProps) {
  const [movements, setMovements] = useState<StockMovementSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (ingredient && isOpen) {
      setIsLoading(true);
      setErrorMessage("");
      listStockMovements({ ingredientId: ingredient.id, limit: 50 }, branchId)
        .then((res) => {
          if (res.success) {
            setMovements(res.data.movements);
          } else {
            setErrorMessage(res.error);
          }
        })
        .catch((err) => {
          setErrorMessage(err.message || "Failed to load movement ledger.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [ingredient, isOpen, branchId]);

  if (!isOpen || !ingredient) return null;

  const renderBadge = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ShoppingCart className="h-3 w-3" /> Purchase
          </span>
        );
      case "CONSUMPTION":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <ArrowDownRight className="h-3 w-3" /> Consumption
          </span>
        );
      case "REVERSAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <RefreshCcw className="h-3 w-3" /> Reversal
          </span>
        );
      case "ADJUSTMENT_ADD":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <ArrowUpRight className="h-3 w-3" /> Adjustment (+)
          </span>
        );
      case "ADJUSTMENT_REMOVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <ArrowDownRight className="h-3 w-3" /> Adjustment (-)
          </span>
        );
      case "WASTE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Trash2 className="h-3 w-3" /> Waste
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Stock Ledger: {ingredient.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current: {ingredient.currentStock} {ingredient.unit} • Reorder: {ingredient.reorderLevel} {ingredient.unit}
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
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
              <p className="text-sm">Loading audit trail...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No stock movements recorded yet for this ingredient.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {renderBadge(mov.movementType)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(mov.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {mov.notes || (mov.referenceKey ? `Ref: ${mov.referenceKey}` : "No notes")}
                    </p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-sm font-bold text-foreground">
                      {mov.movementType === "CONSUMPTION" || mov.movementType === "ADJUSTMENT_REMOVE" || mov.movementType === "WASTE"
                        ? "-"
                        : "+"}
                      {mov.quantity} {mov.unit}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {mov.beforeStock ?? mov.stockBefore ?? 0} &rarr; <span className="font-semibold text-foreground">{mov.afterStock ?? mov.stockAfter ?? 0} {mov.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-border bg-muted/20">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
