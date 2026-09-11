"use client";

import { useState, useMemo } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBillingMoney } from "@/lib/billing";
import type { PosCatalogItem, PosCartLineCustomization } from "@/types/billing";
import { cn } from "@/lib/utils";

type PosItemCustomizerModalProps = {
  item: PosCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    item: PosCatalogItem;
    quantity: number;
    notes: string;
    customizations: PosCartLineCustomization[];
    calculatedUnitPrice: number;
  }) => void;
};

export function PosItemCustomizerModal({
  item,
  isOpen,
  onClose,
  onConfirm,
}: PosItemCustomizerModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  // Selected option ID map: groupId -> optionId
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Initialize default options when item opens
  const groups = useMemo(() => item?.customizationGroups ?? [], [item?.customizationGroups]);

  const basePrice = item?.price ?? 0;

  const resolvedCustomizations: PosCartLineCustomization[] = useMemo(() => {
    if (!item) return [];
    const list: PosCartLineCustomization[] = [];
    for (const group of groups) {
      const selectedOptionId = selectedOptions[group.id];
      const opt = group.options.find((o) => o.id === selectedOptionId);
      if (opt) {
        list.push({
          groupId: group.id,
          groupName: group.name,
          optionId: opt.id,
          optionName: opt.name,
          priceDelta: opt.priceDelta ?? 0,
        });
      }
    }
    return list;
  }, [item, groups, selectedOptions]);

  const customizationTotal = useMemo(() => {
    return resolvedCustomizations.reduce((sum, c) => sum + c.priceDelta, 0);
  }, [resolvedCustomizations]);

  const calculatedUnitPrice = Math.max(0, basePrice + customizationTotal);
  const calculatedTotal = Math.round((calculatedUnitPrice * quantity + Number.EPSILON) * 100) / 100;

  if (!isOpen || !item) return null;

  function handleOptionSelect(groupId: string, optionId: string) {
    setSelectedOptions((prev) => {
      // Toggle if already selected, or switch
      if (prev[groupId] === optionId) {
        const next = { ...prev };
        delete next[groupId];
        return next;
      }
      return { ...prev, [groupId]: optionId };
    });
  }

  function handleAdd() {
    if (!item) return;
    onConfirm({
      item,
      quantity,
      notes: notes.trim(),
      customizations: resolvedCustomizations,
      calculatedUnitPrice,
    });
    setQuantity(1);
    setNotes("");
    setSelectedOptions({});
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">{item.name}</h2>
            <p className="text-xs text-muted-foreground">
              Base Price: {formatBillingMoney(basePrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Customization groups */}
          {groups.map((group) => {
            const currentSelected = selectedOptions[group.id];
            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {group.name}
                  </span>
                  {group.isRequired && (
                    <span className="text-[10px] font-semibold text-amber-500">
                      Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {group.options.map((opt) => {
                    const isSelected = currentSelected === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleOptionSelect(group.id, opt.id)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-3 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "border-border/60 bg-muted/30 text-foreground hover:border-border hover:bg-muted/60"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex size-4 items-center justify-center rounded-full border transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40"
                            )}
                          >
                            {isSelected && <Check className="size-2.5 stroke-3" />}
                          </div>
                          <span className="text-xs">{opt.name}</span>
                        </div>
                        {opt.priceDelta > 0 && (
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            +{formatBillingMoney(opt.priceDelta)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Cooking instructions notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cooking Notes / Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Extra spicy, no onions, less oil"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={255}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Quantity
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-6 text-center text-sm font-bold text-foreground font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3.5">
          <div>
            <p className="text-[11px] text-muted-foreground">Total Price</p>
            <p className="text-base font-extrabold text-foreground">
              {formatBillingMoney(calculatedTotal)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              size="sm"
              className="h-10 rounded-xl px-5 font-bold tracking-wide shadow-md"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
