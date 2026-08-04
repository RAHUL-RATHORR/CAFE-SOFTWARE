"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Search, Flame, Star } from "lucide-react";
import { motion } from "framer-motion";
import { PublicMenuShell } from "@/components/qr-ordering/public-menu-shell";
import { EmptyState } from "@/components/common/empty-state";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppCard } from "@/components/cards/app-card";
import {
  PUBLIC_DIETARY_LABELS,
  buildPublicMenuPath,
} from "@/config/qr-ordering";
import { useGuestCartStore } from "@/store/guest-cart-store";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { PublicMenuPayload } from "@/types/qr-ordering";
import type { MenuItem } from "@/types/menu-item";
import type { PublicDietaryFilter } from "@/types/qr-ordering";

type PublicMenuViewProps = {
  payload: PublicMenuPayload;
  restaurantParam: string;
  tableParam?: string;
  initialQuery?: {
    q?: string;
    categoryId?: string;
    dietary?: string;
  };
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

function MenuItemCard({
  item,
  currency,
  onAdd,
}: {
  item: MenuItem;
  currency: string;
  onAdd: (item: MenuItem) => void;
}) {
  const price = item.discountPrice ?? item.price;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
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
            Image placeholder
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
          ) : (
            <DsBadge variant="info" size="sm">
              Available
            </DsBadge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold leading-tight">{item.name}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {item.shortDescription || item.description || "Chef special"}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="text-sm font-semibold">
            {formatMoney(price, currency)}
            {item.discountPrice != null ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
                {formatMoney(item.price, currency)}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-xl"
            disabled={!item.isAvailable}
            onClick={() => onAdd(item)}
          >
            Add
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export function PublicMenuView({
  payload,
  restaurantParam,
  tableParam,
  initialQuery,
}: PublicMenuViewProps) {
  const router = useRouter();
  const addItem = useGuestCartStore((state) => state.addItem);
  const [q, setQ] = useState(initialQuery?.q ?? "");
  const [dietary, setDietary] = useState<PublicDietaryFilter>(
    (initialQuery?.dietary as PublicDietaryFilter) || "all"
  );
  const [categoryId, setCategoryId] = useState(initialQuery?.categoryId ?? "");
  const [, startTransition] = useTransition();

  const slug = payload.restaurant.slug || restaurantParam;

  function pushFilters(next: {
    q?: string;
    dietary?: string;
    categoryId?: string;
  }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextDietary = next.dietary ?? dietary;
    const nextCategory = next.categoryId ?? categoryId;
    if (nextQ) params.set("q", nextQ);
    if (nextDietary && nextDietary !== "all") params.set("dietary", nextDietary);
    if (nextCategory) params.set("categoryId", nextCategory);
    const base = buildPublicMenuPath(slug, undefined, tableParam);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${base}?${qs}` : base);
    });
  }

  function handleAdd(item: MenuItem) {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.discountPrice ?? item.price,
      isVeg: item.isVeg,
      image: item.image,
    });
    toast.success("Added to cart", item.name);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of payload.items) {
      const key = item.categoryId || "other";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [payload.items]);

  return (
    <PublicMenuShell
      restaurantSlug={slug}
      restaurantName={payload.restaurant.name}
      tableParam={tableParam}
      tableLabel={payload.table?.tableNumber}
      active="menu"
    >
      <div className="space-y-5">
        <AppCard
          title={payload.restaurant.name}
          description={payload.restaurant.address || "Welcome — order from your table"}
          contentClassName="space-y-3"
        >
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {payload.restaurant.phone ? (
              <span>{payload.restaurant.phone}</span>
            ) : null}
            <span>·</span>
            <span>{payload.restaurant.currency}</span>
            {payload.table ? (
              <>
                <span>·</span>
                <span>Table {payload.table.tableNumber}</span>
              </>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            QR: {payload.qr.code}
            {!payload.qr.validated ? " · validation placeholder" : ""}
            {payload.qr.expired ? " · expired placeholder" : ""}
          </p>
        </AppCard>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            pushFilters({ q });
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search menu items…"
              className="rounded-xl pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(PUBLIC_DIETARY_LABELS) as PublicDietaryFilter[]).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium",
                    dietary === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                  onClick={() => {
                    setDietary(key);
                    pushFilters({ dietary: key });
                  }}
                >
                  {key === "spicy" ? <Flame className="size-3" /> : null}
                  {PUBLIC_DIETARY_LABELS[key]}
                  {key === "spicy" ? (
                    <span className="opacity-70">(placeholder)</span>
                  ) : null}
                </button>
              )
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                !categoryId
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={() => {
                setCategoryId("");
                pushFilters({ categoryId: "" });
              }}
            >
              All categories
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
                onClick={() => {
                  setCategoryId(category.id);
                  pushFilters({ categoryId: category.id });
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </form>

        {payload.featuredItems.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Popular</h2>
              <span className="text-xs text-muted-foreground">
                Recommended placeholder
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {payload.featuredItems.map((item) => (
                <MenuItemCard
                  key={`featured-${item.id}`}
                  item={item}
                  currency={payload.restaurant.currency}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          </section>
        ) : null}

        {payload.items.length === 0 ? (
          <EmptyState
            title="No menu items"
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
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      currency={payload.restaurant.currency}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto flex max-w-5xl gap-2">
            <Link
              href={buildPublicMenuPath(slug, "cart", tableParam)}
              className="flex-1"
            >
              <Button type="button" className="w-full rounded-xl">
                View cart
              </Button>
            </Link>
            <Link
              href={buildPublicMenuPath(slug, "checkout", tableParam)}
              className="flex-1"
            >
              <Button type="button" variant="secondary" className="w-full rounded-xl">
                Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicMenuShell>
  );
}
