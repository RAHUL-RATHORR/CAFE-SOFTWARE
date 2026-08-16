"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag, Utensils } from "lucide-react";
import { useGuestCartStore } from "@/store/guest-cart-store";
import {
  buildPublicOrderPath,
  buildPublicOrderStatusPath,
} from "@/config/qr-ordering";
import { cn } from "@/lib/utils";

type PublicOrderShellProps = {
  tableToken: string;
  restaurantName: string;
  restaurantLogo?: string;
  branchName: string;
  tableLabel: string;
  currency?: string;
  children: React.ReactNode;
  active?: "menu" | "cart" | "checkout" | "confirmation" | "status";
};

export function PublicOrderShell({
  tableToken,
  restaurantName,
  restaurantLogo,
  branchName,
  tableLabel,
  currency = "INR",
  children,
  active = "menu",
}: PublicOrderShellProps) {
  const setOrderingContext = useGuestCartStore(
    (state) => state.setOrderingContext
  );
  const itemCount = useGuestCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const lastTrackingToken = useGuestCartStore(
    (state) => state.lastTrackingToken
  );

  useEffect(() => {
    setOrderingContext({
      tableToken,
      restaurantSlug: tableToken,
      restaurantName,
      branchName,
      tableLabel,
      currency,
    });
  }, [
    tableToken,
    restaurantName,
    branchName,
    tableLabel,
    currency,
    setOrderingContext,
  ]);

  const links = [
    {
      id: "menu" as const,
      href: buildPublicOrderPath(tableToken),
      label: "Menu",
    },
    {
      id: "cart" as const,
      href: buildPublicOrderPath(tableToken, "cart"),
      label: "Cart",
    },
    {
      id: "checkout" as const,
      href: buildPublicOrderPath(tableToken, "checkout"),
      label: "Checkout",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 pb-24 md:pb-8">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {restaurantLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurantLogo}
                alt=""
                className="size-10 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Utensils className="size-4" aria-hidden />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {restaurantName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {branchName} · Table {tableLabel}
              </p>
            </div>
          </div>
          <Link
            href={buildPublicOrderPath(tableToken, "cart")}
            className="relative inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card"
            aria-label="Open cart"
          >
            <ShoppingBag className="size-4" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                active === link.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {lastTrackingToken ? (
            <Link
              href={buildPublicOrderStatusPath(lastTrackingToken)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                active === "status" || active === "confirmation"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              Track
            </Link>
          ) : null}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-4">{children}</main>
    </div>
  );
}
