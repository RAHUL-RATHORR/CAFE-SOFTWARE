"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { PublicOrderShell } from "@/components/qr-ordering/public-order-shell";
import { AppCard } from "@/components/cards/app-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGuestOrder } from "@/actions/qr-ordering";
import {
  buildPublicOrderPath,
  buildPublicOrderStatusPath,
} from "@/config/qr-ordering";
import { createGuestOrderSchema } from "@/lib/validators/qr-ordering";
import { useGuestCartStore } from "@/store/guest-cart-store";
import { toast } from "@/store/toast-store";

type PublicOrderCheckoutViewProps = {
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

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function PublicOrderCheckoutView({
  tableToken,
  restaurantName,
  restaurantLogo,
  branchName,
  tableLabel,
  currency,
}: PublicOrderCheckoutViewProps) {
  const router = useRouter();
  const items = useGuestCartStore((state) => state.items);
  const notes = useGuestCartStore((state) => state.notes);
  const clear = useGuestCartStore((state) => state.clear);
  const setLastTrackingToken = useGuestCartStore(
    (state) => state.setLastTrackingToken
  );
  const summary = useGuestCartStore((state) => state.getSummary());
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => createIdempotencyKey());

  const form = useForm({
    defaultValues: {
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      notes,
      paymentPlaceholder: "pay-later" as const,
    },
  });

  const linePayload = useMemo(
    () =>
      items.map((item) => ({
        key: item.key,
        menuItemId: item.menuItemId ?? "",
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
        isVeg: item.isVeg,
        image: item.image,
        customizations: item.customizations ?? [],
      })),
    [items]
  );

  if (items.length === 0) {
    return (
      <PublicOrderShell
        tableToken={tableToken}
        restaurantName={restaurantName}
        restaurantLogo={restaurantLogo}
        branchName={branchName}
        tableLabel={tableLabel}
        currency={currency}
        active="checkout"
      >
        <EmptyState
          title="Nothing to checkout"
          description="Add items to your cart first."
          action={
            <Link href={buildPublicOrderPath(tableToken)}>
              <Button className="rounded-xl">Browse menu</Button>
            </Link>
          }
        />
      </PublicOrderShell>
    );
  }

  return (
    <PublicOrderShell
      tableToken={tableToken}
      restaurantName={restaurantName}
      restaurantLogo={restaurantLogo}
      branchName={branchName}
      tableLabel={tableLabel}
      currency={currency}
      active="checkout"
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          const payload = {
            tableToken,
            guestName: values.guestName,
            guestPhone: values.guestPhone,
            guestEmail: values.guestEmail,
            notes: values.notes,
            paymentPlaceholder: values.paymentPlaceholder,
            idempotencyKey,
            items: linePayload,
          };
          const parsed = createGuestOrderSchema.safeParse(payload);
          if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? "Invalid checkout");
            return;
          }
          startTransition(async () => {
            const result = await createGuestOrder(parsed.data);
            if (!result.success) {
              toast.error(result.error.message);
              return;
            }
            const confirmation = result.data.confirmation;
            clear();
            setLastTrackingToken(confirmation.trackingToken);
            toast.success("Order placed", confirmation.orderNumber);
            router.push(
              `${buildPublicOrderPath(tableToken, "confirmation")}?token=${encodeURIComponent(confirmation.trackingToken)}`
            );
            router.refresh();
          });
        })}
      >
        <AppCard
          title="Your details"
          description="Optional — you can order anonymously"
          contentClassName="grid gap-3 sm:grid-cols-2"
        >
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Name (optional)</span>
            <Input className="rounded-xl" {...form.register("guestName")} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Phone (optional)</span>
            <Input className="rounded-xl" {...form.register("guestPhone")} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Email (optional)</span>
            <Input className="rounded-xl" {...form.register("guestEmail")} />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Payment (placeholder)</span>
            <select
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              {...form.register("paymentPlaceholder")}
            >
              <option value="pay-later">Pay later</option>
              <option value="counter">Pay at counter</option>
              <option value="online">Online (placeholder)</option>
            </select>
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Order notes</span>
            <Input className="rounded-xl" {...form.register("notes")} />
          </label>
        </AppCard>

        <AppCard title="Review" contentClassName="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Table {tableLabel} · {branchName}
          </p>
          {items.map((item) => (
            <div key={item.key} className="flex justify-between gap-3">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span>{formatMoney(item.price * item.quantity, currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Estimated total</span>
            <span>{formatMoney(summary.grandTotal, currency)}</span>
          </div>
        </AppCard>

        <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
          {isPending ? "Placing order…" : "Place order"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          After placing, you can track status at{" "}
          <span className="font-medium">
            {buildPublicOrderStatusPath("your-token")}
          </span>
        </p>
      </form>
    </PublicOrderShell>
  );
}
