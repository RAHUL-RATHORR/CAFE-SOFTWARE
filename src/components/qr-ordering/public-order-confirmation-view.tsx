"use client";

import Link from "next/link";
import { PublicOrderShell } from "@/components/qr-ordering/public-order-shell";
import { AppCard } from "@/components/cards/app-card";
import { Button } from "@/components/ui/button";
import {
  buildPublicOrderPath,
  buildPublicOrderStatusPath,
} from "@/config/qr-ordering";
import type { GuestOrderConfirmation } from "@/types/qr-ordering";

type PublicOrderConfirmationViewProps = {
  tableToken: string;
  restaurantName: string;
  restaurantLogo?: string;
  branchName: string;
  tableLabel: string;
  currency: string;
  confirmation: GuestOrderConfirmation;
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

export function PublicOrderConfirmationView({
  tableToken,
  restaurantName,
  restaurantLogo,
  branchName,
  tableLabel,
  currency,
  confirmation,
}: PublicOrderConfirmationViewProps) {
  return (
    <PublicOrderShell
      tableToken={tableToken}
      restaurantName={restaurantName}
      restaurantLogo={restaurantLogo}
      branchName={branchName}
      tableLabel={tableLabel}
      currency={currency}
      active="confirmation"
    >
      <AppCard
        title="Order received"
        description="Your order was sent to the kitchen."
        contentClassName="space-y-4"
      >
        <div className="space-y-2 text-sm">
          <p>
            Order{" "}
            <span className="font-semibold">{confirmation.orderNumber}</span>
          </p>
          <p className="text-muted-foreground">
            Table {confirmation.tableLabel || tableLabel}
          </p>
          <p className="text-muted-foreground">
            Total{" "}
            {formatMoney(
              confirmation.grandTotal,
              confirmation.currency || currency
            )}
          </p>
          <p className="font-medium text-foreground">
            Status: {confirmation.statusLabel || "Order Received"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="flex-1"
            href={buildPublicOrderStatusPath(confirmation.trackingToken)}
          >
            <Button className="w-full rounded-xl">Track order</Button>
          </Link>
          <Link className="flex-1" href={buildPublicOrderPath(tableToken)}>
            <Button variant="outline" className="w-full rounded-xl">
              Back to menu
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          {branchName} · keep this page or tracking link for updates.
        </p>
      </AppCard>
    </PublicOrderShell>
  );
}
