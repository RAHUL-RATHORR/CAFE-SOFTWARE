"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PublicOrderShell } from "@/components/qr-ordering/public-order-shell";
import { EmptyState } from "@/components/common/empty-state";
import { AppCard } from "@/components/cards/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildPublicOrderPath } from "@/config/qr-ordering";
import { useGuestCartStore } from "@/store/guest-cart-store";

type PublicOrderCartViewProps = {
  tableToken: string;
  restaurantName: string;
  restaurantLogo?: string;
  branchName: string;
  tableLabel: string;
  currency: string;
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

export function PublicOrderCartView({
  tableToken,
  restaurantName,
  restaurantLogo,
  branchName,
  tableLabel,
  currency,
}: PublicOrderCartViewProps) {
  const items = useGuestCartStore((state) => state.items);
  const notes = useGuestCartStore((state) => state.notes);
  const increase = useGuestCartStore((state) => state.increase);
  const decrease = useGuestCartStore((state) => state.decrease);
  const removeItem = useGuestCartStore((state) => state.removeItem);
  const setItemNotes = useGuestCartStore((state) => state.setItemNotes);
  const setNotes = useGuestCartStore((state) => state.setNotes);
  const summary = useGuestCartStore((state) => state.getSummary());

  return (
    <PublicOrderShell
      tableToken={tableToken}
      restaurantName={restaurantName}
      restaurantLogo={restaurantLogo}
      branchName={branchName}
      tableLabel={tableLabel}
      currency={currency}
      active="cart"
    >
      <div className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="Cart is empty"
            description="Browse the menu and add items to get started."
            action={
              <Link href={buildPublicOrderPath(tableToken)}>
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
                        <span className="ml-1 text-[11px]">(display only)</span>
                      </p>
                      {item.customizations?.length ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Customized
                        </p>
                      ) : null}
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
                <span>Estimated subtotal</span>
                <span>{formatMoney(summary.subtotal, currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Final tax and total are calculated securely when you place the
                order.
              </p>
            </AppCard>

            <AppCard title="Order notes" contentClassName="space-y-2">
              <Input
                value={notes}
                placeholder="Anything we should know?"
                className="rounded-xl"
                onChange={(event) => setNotes(event.target.value)}
              />
            </AppCard>

            <Link href={buildPublicOrderPath(tableToken, "checkout")}>
              <Button className="w-full rounded-xl">Continue to checkout</Button>
            </Link>
          </>
        )}
      </div>
    </PublicOrderShell>
  );
}
