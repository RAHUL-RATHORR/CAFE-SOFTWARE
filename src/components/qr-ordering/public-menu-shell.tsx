"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag, Utensils } from "lucide-react";
import { useGuestCartStore } from "@/store/guest-cart-store";
import { buildPublicMenuPath } from "@/config/qr-ordering";
import { cn } from "@/lib/utils";

type PublicMenuShellProps = {
  restaurantSlug: string;
  restaurantName: string;
  tableParam?: string | null;
  tableLabel?: string | null;
  children: React.ReactNode;
  active?: "menu" | "categories" | "cart" | "checkout" | "tracking";
};

export function PublicMenuShell({
  restaurantSlug,
  restaurantName,
  tableParam,
  tableLabel,
  children,
  active = "menu",
}: PublicMenuShellProps) {
  const setContext = useGuestCartStore((state) => state.setContext);
  const itemCount = useGuestCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  useEffect(() => {
    setContext(restaurantSlug, tableParam ?? null);
  }, [restaurantSlug, tableParam, setContext]);

  const links = [
    {
      id: "menu" as const,
      href: buildPublicMenuPath(
        restaurantSlug,
        undefined,
        tableParam ?? undefined
      ),
      label: "Menu",
    },
    {
      id: "categories" as const,
      href: buildPublicMenuPath(
        restaurantSlug,
        "categories",
        tableParam ?? undefined
      ),
      label: "Categories",
    },
    {
      id: "cart" as const,
      href: buildPublicMenuPath(
        restaurantSlug,
        "cart",
        tableParam ?? undefined
      ),
      label: "Cart",
    },
    {
      id: "tracking" as const,
      href: buildPublicMenuPath(
        restaurantSlug,
        "tracking",
        tableParam ?? undefined
      ),
      label: "Track",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Utensils className="size-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {restaurantName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {tableLabel
                  ? `Table ${tableLabel} · Self-service`
                  : "Digital menu · Self-service"}
              </p>
            </div>
          </div>
          <Link
            href={buildPublicMenuPath(
              restaurantSlug,
              "cart",
              tableParam ?? undefined
            )}
            className="relative inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card"
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingBag className="size-4" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            ) : null}
          </Link>
        </div>
        <nav
          aria-label="Menu sections"
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3"
        >
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active === link.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5 pb-24">{children}</main>
    </div>
  );
}
