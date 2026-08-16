"use client";

import { useMemo, useState } from "react";
import { Leaf, Search, Star } from "lucide-react";
import Link from "next/link";
import { PublicOrderShell } from "@/components/qr-ordering/public-order-shell";
import { OrderItemSheet } from "@/components/qr-ordering/order-item-sheet";
import { EmptyState } from "@/components/common/empty-state";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildPublicOrderPath } from "@/config/qr-ordering";
import { useGuestCartStore } from "@/store/guest-cart-store";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { PublicOrderingPayload } from "@/types/qr-ordering";
import type { MenuItem } from "@/types/menu-item";

type PublicOrderMenuViewProps = {
  payload: PublicOrderingPayload;
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

function displayPrice(item: MenuItem) {
  return item.discountPrice ?? item.price;
}

export function PublicOrderMenuView({ payload }: PublicOrderMenuViewProps) {
  const addItem = useGuestCartStore((state) => state.addItem);
  const itemCount = useGuestCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const summary = useGuestCartStore((state) => state.getSummary());
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const tableLabel = `${payload.table.tableName} (${payload.table.tableNumber})`;
  const currency = payload.restaurant.currency;

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    return payload.items.filter((item) => {
      if (categoryId && item.categoryId !== categoryId) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.shortDescription.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [payload.items, categoryId, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of filteredItems) {
      const key = item.categoryId || "other";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [filteredItems]);

  function handleQuickAdd(item: MenuItem) {
    if (!item.isAvailable) return;
    if ((item.customizationGroups?.length ?? 0) > 0) {
      setSelectedItem(item);
      return;
    }
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: displayPrice(item),
      isVeg: item.isVeg,
      image: item.image,
      customizations: [],
    });
    toast.success("Added to cart", item.name);
  }

  return (
    <PublicOrderShell
      tableToken={payload.tableToken}
      restaurantName={payload.restaurant.name}
      restaurantLogo={payload.restaurant.logo}
      branchName={payload.branch.name}
      tableLabel={tableLabel}
      currency={currency}
      active="menu"
    >
      <div className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search this menu…"
            className="rounded-xl pl-9"
            aria-label="Search menu"
          />
        </div>

        <div className="sticky top-[7.25rem] z-20 -mx-4 border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur md:top-[6.5rem]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                !categoryId
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={() => setCategoryId("")}
            >
              All
            </button>
            {payload.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                  categoryId === category.id
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                )}
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            title="No matching items"
            description="Try another category or search term."
          />
        ) : (
          [...grouped.entries()].map(([catId, items]) => {
            const category = payload.categories.find((c) => c.id === catId);
            return (
              <section key={catId} className="space-y-3">
                <h2 className="text-base font-semibold">
                  {category?.name ?? "Menu"}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => {
                    const price = displayPrice(item);
                    return (
                      <article
                        key={item.id}
                        className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
                      >
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="relative aspect-[16/10] bg-muted">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt=""
                                className="size-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                                No image
                              </div>
                            )}
                            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                              {item.isVeg ? (
                                <DsBadge variant="success" size="sm">
                                  <Leaf className="mr-1 size-3" aria-hidden />
                                  Veg
                                </DsBadge>
                              ) : (
                                <DsBadge variant="danger" size="sm">
                                  Non-veg
                                </DsBadge>
                              )}
                              {item.isFeatured ? (
                                <DsBadge variant="warning" size="sm">
                                  <Star className="mr-1 size-3" aria-hidden />
                                  Popular
                                </DsBadge>
                              ) : null}
                              {!item.isAvailable ? (
                                <DsBadge variant="secondary" size="sm">
                                  Unavailable
                                </DsBadge>
                              ) : null}
                            </div>
                          </div>
                          <div className="space-y-1 p-3 pb-0">
                            <h3 className="text-sm font-semibold leading-tight">
                              {item.name}
                            </h3>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {item.shortDescription ||
                                item.description ||
                                "Chef special"}
                            </p>
                          </div>
                        </button>
                        <div className="mt-auto flex items-center justify-between gap-2 p-3 pt-2">
                          <div className="text-sm font-semibold">
                            {formatMoney(price, currency)}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl"
                            disabled={!item.isAvailable}
                            onClick={() => handleQuickAdd(item)}
                          >
                            {item.customizationGroups?.length ? "Customize" : "Add"}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      {itemCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
          <Link href={buildPublicOrderPath(payload.tableToken, "cart")}>
            <Button className="w-full rounded-xl">
              View cart · {itemCount} · {formatMoney(summary.grandTotal, currency)}
            </Button>
          </Link>
        </div>
      ) : null}

      <aside className="fixed bottom-6 right-6 z-30 hidden w-72 rounded-2xl border border-border bg-card p-4 shadow-lg md:block">
        <p className="text-sm font-semibold">Your cart</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {itemCount === 0
            ? "Add items from the menu"
            : `${itemCount} item(s) · ${formatMoney(summary.grandTotal, currency)}`}
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href={buildPublicOrderPath(payload.tableToken, "cart")}
            className="flex-1"
          >
            <Button variant="outline" className="w-full rounded-xl" size="sm">
              Cart
            </Button>
          </Link>
          <Link
            href={buildPublicOrderPath(payload.tableToken, "checkout")}
            className="flex-1"
          >
            <Button className="w-full rounded-xl" size="sm" disabled={itemCount === 0}>
              Checkout
            </Button>
          </Link>
        </div>
      </aside>

      <OrderItemSheet
        item={selectedItem}
        currency={currency}
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
        onAdd={(payloadItem) => {
          addItem(payloadItem);
          toast.success("Added to cart", payloadItem.name);
          setSelectedItem(null);
        }}
      />
    </PublicOrderShell>
  );
}
