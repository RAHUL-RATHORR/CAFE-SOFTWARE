"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { PublicMenuShell } from "@/components/qr-ordering/public-menu-shell";
import { AppCard } from "@/components/cards/app-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGuestOrder } from "@/actions/qr-ordering";
import { buildPublicMenuPath } from "@/config/qr-ordering";
import { createGuestOrderSchema } from "@/lib/validators/qr-ordering";
import { useGuestCartStore } from "@/store/guest-cart-store";
import { toast } from "@/store/toast-store";

type PublicCheckoutViewProps = {
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

export function PublicCheckoutView({
  restaurantParam,
  restaurantName,
  currency,
  tableParam,
  tableLabel,
}: PublicCheckoutViewProps) {
  const router = useRouter();
  const items = useGuestCartStore((state) => state.items);
  const notes = useGuestCartStore((state) => state.notes);
  const clear = useGuestCartStore((state) => state.clear);
  const summary = useGuestCartStore((state) => state.getSummary());
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState<{
    orderNumber: string;
    trackingToken: string;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      notes,
      paymentPlaceholder: "pay-later" as const,
      tableNumber: tableLabel ?? tableParam ?? "",
    },
  });

  if (confirmed) {
    return (
      <PublicMenuShell
        restaurantSlug={restaurantParam}
        restaurantName={restaurantName}
        tableParam={tableParam}
        tableLabel={tableLabel}
        active="checkout"
      >
        <AppCard
          title="Order confirmed"
          description="Your order was sent to the kitchen. Payment remains a placeholder."
          contentClassName="space-y-4"
        >
          <p className="text-sm">
            Order <span className="font-semibold">{confirmed.orderNumber}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Tracking token: {confirmed.trackingToken}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className="flex-1"
              href={`${buildPublicMenuPath(restaurantParam, "tracking", tableParam)}?token=${encodeURIComponent(confirmed.trackingToken)}`}
            >
              <Button className="w-full rounded-xl">Track order</Button>
            </Link>
            <Link
              className="flex-1"
              href={buildPublicMenuPath(restaurantParam, undefined, tableParam)}
            >
              <Button variant="outline" className="w-full rounded-xl">
                Back to menu
              </Button>
            </Link>
          </div>
        </AppCard>
      </PublicMenuShell>
    );
  }

  if (items.length === 0) {
    return (
      <PublicMenuShell
        restaurantSlug={restaurantParam}
        restaurantName={restaurantName}
        tableParam={tableParam}
        tableLabel={tableLabel}
        active="checkout"
      >
        <EmptyState
          title="Nothing to checkout"
          description="Add items to your cart first."
          action={
            <Link href={buildPublicMenuPath(restaurantParam, undefined, tableParam)}>
              <Button className="rounded-xl">Browse menu</Button>
            </Link>
          }
        />
      </PublicMenuShell>
    );
  }

  return (
    <PublicMenuShell
      restaurantSlug={restaurantParam}
      restaurantName={restaurantName}
      tableParam={tableParam}
      tableLabel={tableLabel}
      active="checkout"
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          const payload = {
            restaurant: restaurantParam,
            table: tableParam || values.tableNumber || "",
            guestName: values.guestName,
            guestPhone: values.guestPhone,
            guestEmail: values.guestEmail,
            notes: values.notes,
            paymentPlaceholder: values.paymentPlaceholder,
            items,
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
            clear();
            setConfirmed({
              orderNumber: result.data.order.orderNumber,
              trackingToken: result.data.trackingToken,
            });
            toast.success("Order placed", result.data.order.orderNumber);
            router.refresh();
          });
        })}
      >
        <AppCard title="Guest checkout" description="No account required" contentClassName="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Your name</span>
            <Input className="rounded-xl" {...form.register("guestName")} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Phone</span>
            <Input className="rounded-xl" {...form.register("guestPhone")} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Email</span>
            <Input className="rounded-xl" {...form.register("guestEmail")} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Table number</span>
            <Input className="rounded-xl" {...form.register("tableNumber")} />
          </label>
          <label className="space-y-1 text-sm">
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

        <AppCard title="Summary" contentClassName="space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.key} className="flex justify-between gap-3">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span>{formatMoney(item.price * item.quantity, currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Grand total</span>
            <span>{formatMoney(summary.grandTotal, currency)}</span>
          </div>
        </AppCard>

        <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
          {isPending ? "Placing order…" : "Place order"}
        </Button>
      </form>
    </PublicMenuShell>
  );
}
