"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PublicMenuShell } from "@/components/qr-ordering/public-menu-shell";
import { EmptyState } from "@/components/common/empty-state";
import { AppCard } from "@/components/cards/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildPublicMenuPath } from "@/config/qr-ordering";
import { useGuestCartStore } from "@/store/guest-cart-store";

type PublicCartViewProps = {
  restaurantParam: string;
  restaurantName: string;
  currency: string;
  tableParam?: string;
  tableLabel?: string | null;
};

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function PublicCartView({
  restaurantParam,
  restaurantName,
  currency,
  tableParam,
  tableLabel,
}: PublicCartViewProps) {
  const items = useGuestCartStore((state) => state.items);
  const notes = useGuestCartStore((state) => state.notes);
  const increase = useGuestCartStore((state) => state.increase);
  const decrease = useGuestCartStore((state) => state.decrease);
  const removeItem = useGuestCartStore((state) => state.removeItem);
  const setItemNotes = useGuestCartStore((state) => state.setItemNotes);
  const setNotes = useGuestCartStore((state) => state.setNotes);
  const summary = useGuestCartStore((state) => state.getSummary());

  return (
    <PublicMenuShell
      restaurantSlug={restaurantParam}
      restaurantName={restaurantName}
      tableParam={tableParam}
      tableLabel={tableLabel}
      active="cart"
    >
      <div className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="Cart is empty"
            description="Browse the menu and add items to get started."
            action={
              <Link href={buildPublicMenuPath(restaurantParam, undefined, tableParam)}>
                <Button className="rounded-xl">Browse menu</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <AppCard key={item.key} contentClassName="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatMoney(item.price, currency)} each
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="rounded-lg"
                      aria-label="Remove item"
                      onClick={() => removeItem(item.key)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => decrease(item.key)}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="min-w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => increase(item.key)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                    <span className="ml-auto text-sm font-semibold">
                      {formatMoney(item.price * item.quantity, currency)}
                    </span>
                  </div>
                  <Input
                    value={item.notes}
                    placeholder="Special instructions"
                    className="rounded-xl"
                    onChange={(event) =>
                      setItemNotes(item.key, event.target.value)
                    }
                  />
                </AppCard>
              ))}
            </div>

            <AppCard title="Order summary" contentClassName="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(summary.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (placeholder)</span>
                <span>{formatMoney(summary.tax, currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service charge (placeholder)</span>
                <span>{formatMoney(summary.serviceCharge, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span>Grand total</span>
                <span>{formatMoney(summary.grandTotal, currency)}</span>
              </div>
            </AppCard>

            <AppCard title="Order notes" contentClassName="space-y-2">
              <Input
                value={notes}
                placeholder="Anything we should know?"
                className="rounded-xl"
                onChange={(event) => setNotes(event.target.value)}
              />
            </AppCard>

            <Link href={buildPublicMenuPath(restaurantParam, "checkout", tableParam)}>
              <Button className="w-full rounded-xl">Continue to checkout</Button>
            </Link>
          </>
        )}
      </div>
    </PublicMenuShell>
  );
}
