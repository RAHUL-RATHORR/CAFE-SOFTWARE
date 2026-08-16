"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/menu-item";
import type { GuestCartCustomization } from "@/types/qr-ordering";

type OrderItemSheetProps = {
  item: MenuItem | null;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (payload: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    notes: string;
    isVeg: boolean;
    image: string;
    customizations: GuestCartCustomization[];
  }) => void;
};

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function OrderItemSheet({
  item,
  currency,
  open,
  onOpenChange,
  onAdd,
}: OrderItemSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setQuantity(1);
    setNotes("");
    setError(null);
    const initial: Record<string, string[]> = {};
    for (const group of item.customizationGroups ?? []) {
      initial[group.id] = [];
    }
    setSelections(initial);
  }, [item]);

  const basePrice = item ? (item.discountPrice ?? item.price) : 0;

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    let delta = 0;
    for (const group of item.customizationGroups ?? []) {
      const selected = selections[group.id] ?? [];
      for (const optionId of selected) {
        const option = group.options.find((row) => row.id === optionId);
        if (option) delta += option.priceDelta ?? 0;
      }
    }
    return Math.round((basePrice + delta + Number.EPSILON) * 100) / 100;
  }, [item, selections, basePrice]);

  function toggleOption(groupId: string, optionId: string, max: number) {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (max <= 1) {
        return { ...prev, [groupId]: [optionId] };
      }
      if (current.length >= max) {
        return prev;
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  function handleAdd() {
    if (!item || !item.isAvailable) return;
    for (const group of item.customizationGroups ?? []) {
      const selected = selections[group.id] ?? [];
      const min = group.required ? Math.max(1, group.min || 1) : group.min || 0;
      const max = Math.max(min, group.max || 1);
      if (selected.length < min) {
        setError(`Select at least ${min} option(s) for ${group.name}.`);
        return;
      }
      if (selected.length > max) {
        setError(`Select at most ${max} option(s) for ${group.name}.`);
        return;
      }
    }
    setError(null);
    onAdd({
      menuItemId: item.id,
      name: item.name,
      price: unitPrice,
      quantity,
      notes: notes.trim().slice(0, 255),
      isVeg: item.isVeg,
      image: item.image,
      customizations: Object.entries(selections)
        .filter(([, optionIds]) => optionIds.length > 0)
        .map(([groupId, optionIds]) => ({ groupId, optionIds })),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl sm:max-w-lg sm:mx-auto"
      >
        {item ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle>{item.name}</SheetTitle>
              <SheetDescription>
                {item.shortDescription || item.description || "Customize your order"}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4">
              {!item.isAvailable ? (
                <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  This item is currently unavailable.
                </p>
              ) : null}

              {(item.customizationGroups ?? []).map((group) => {
                const selected = selections[group.id] ?? [];
                const max = Math.max(group.max || 1, 1);
                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.required ? "Required" : "Optional"}
                        {max > 1 ? ` · up to ${max}` : ""}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {group.options.map((option) => {
                        const checked = selected.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={!option.isAvailable || !item.isAvailable}
                            onClick={() =>
                              toggleOption(group.id, option.id, max)
                            }
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm",
                              checked
                                ? "border-primary bg-primary/5"
                                : "border-border",
                              !option.isAvailable && "opacity-50"
                            )}
                          >
                            <span>{option.name}</span>
                            <span className="text-muted-foreground">
                              {option.priceDelta
                                ? `+${formatMoney(option.priceDelta, currency)}`
                                : "Included"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <label className="block space-y-1 text-sm">
                <span className="font-medium">Special instructions</span>
                <Input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="No onions, less spicy…"
                  className="rounded-xl"
                  maxLength={255}
                />
              </label>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="min-w-8 text-center text-sm font-semibold">
                  {quantity}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                >
                  <Plus className="size-3.5" />
                </Button>
                <span className="ml-auto text-sm font-semibold">
                  {formatMoney(unitPrice * quantity, currency)}
                </span>
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>

            <SheetFooter className="px-4 pb-4">
              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={!item.isAvailable}
                onClick={handleAdd}
              >
                Add to cart · {formatMoney(unitPrice * quantity, currency)}
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
