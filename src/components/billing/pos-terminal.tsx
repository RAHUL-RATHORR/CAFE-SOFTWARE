"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Pause, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBill } from "@/actions/billing";
import { usePosCartTotals } from "@/hooks/billing";
import { formatBillingMoney } from "@/lib/billing";
import { usePosCartStore } from "@/store/pos-cart-store";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { PosCatalog } from "@/types/billing";
import {
  BILL_PAYMENT_METHOD_LABELS,
  DISCOUNT_TYPE_LABELS,
  TAX_TYPE_LABELS,
} from "@/config/billing";
import { BILL_PAYMENT_METHODS, DISCOUNT_TYPES, TAX_TYPES } from "@/types/billing";

type PosTerminalProps = {
  catalog: PosCatalog;
};

export function PosTerminal({ catalog }: PosTerminalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof BILL_PAYMENT_METHODS)[number]>("cash");

  const items = usePosCartStore((state) => state.items);
  const discountType = usePosCartStore((state) => state.discountType);
  const discountValue = usePosCartStore((state) => state.discountValue);
  const couponCode = usePosCartStore((state) => state.couponCode);
  const taxType = usePosCartStore((state) => state.taxType);
  const taxRate = usePosCartStore((state) => state.taxRate);
  const serviceCharge = usePosCartStore((state) => state.serviceCharge);
  const notes = usePosCartStore((state) => state.notes);
  const addItem = usePosCartStore((state) => state.addItem);
  const removeItem = usePosCartStore((state) => state.removeItem);
  const increase = usePosCartStore((state) => state.increase);
  const decrease = usePosCartStore((state) => state.decrease);
  const setItemNotes = usePosCartStore((state) => state.setItemNotes);
  const setDiscount = usePosCartStore((state) => state.setDiscount);
  const setCouponCode = usePosCartStore((state) => state.setCouponCode);
  const setTax = usePosCartStore((state) => state.setTax);
  const setServiceCharge = usePosCartStore((state) => state.setServiceCharge);
  const setNotes = usePosCartStore((state) => state.setNotes);
  const clear = usePosCartStore((state) => state.clear);
  const holdOrder = usePosCartStore((state) => state.holdOrder);

  const totals = usePosCartTotals();

  const filteredItems = useMemo(() => {
    return catalog.items.filter((item) => {
      const matchesCategory =
        categoryId === "all" || item.categoryId === categoryId;
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [catalog.items, categoryId, search]);

  function checkout() {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    startTransition(async () => {
      const result = await createBill({
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.modifiers,
        })),
        discountConfig: {
          type: discountType,
          value: discountValue,
          couponCode,
        },
        taxConfig: {
          type: taxType,
          label: TAX_TYPE_LABELS[taxType],
          rate: taxRate,
        },
        serviceCharge,
        paymentMethod,
        notes,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      clear();
      toast.success("Bill created", result.data.invoiceNumber);
      router.push(`/billing/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <AppCard title="Menu" description="Select items for the cart">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu…"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {catalog.categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                size="sm"
                variant={categoryId === category.id ? "secondary" : "outline"}
                className="shrink-0 rounded-xl"
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={cn(
                    "rounded-xl border border-border/70 bg-card p-3 text-left shadow-sm",
                    "transition hover:border-primary/40 hover:shadow-md"
                  )}
                  onClick={() =>
                    addItem({
                      menuItemId: item.id,
                      name: item.name,
                      price: item.price,
                    })
                  }
                >
                  <p className="font-medium leading-tight">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatBillingMoney(item.price)}
                  </p>
                  {item.categoryName ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.categoryName}
                    </p>
                  ) : null}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          {filteredItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No menu items match this filter.
            </p>
          ) : null}
        </AppCard>
      </div>

      <div className="space-y-4">
        <AppCard title="Cart" description="Review items and totals">
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Cart is empty. Tap menu items to add.
            </p>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.li
                    key={item.key}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl border border-border/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBillingMoney(item.price)} each
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Modifiers: none (placeholder)
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        onClick={() => removeItem(item.key)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8 rounded-lg"
                        onClick={() => decrease(item.key)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-8 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8 rounded-lg"
                        onClick={() => increase(item.key)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                      <Input
                        value={item.notes}
                        onChange={(event) =>
                          setItemNotes(item.key, event.target.value)
                        }
                        placeholder="Item notes"
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </AppCard>

        <AppCard title="Order summary" description="Discounts, tax, and payment">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Discount type</span>
              <select
                className="h-10 w-full rounded-xl border border-input bg-background px-3"
                value={discountType}
                onChange={(event) =>
                  setDiscount(
                    event.target.value as typeof discountType,
                    discountValue
                  )
                }
              >
                {DISCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DISCOUNT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Discount value</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={discountValue}
                onChange={(event) =>
                  setDiscount(discountType, Number(event.target.value) || 0)
                }
                className="h-10 rounded-xl"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">
                Coupon code (placeholder)
              </span>
              <Input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="Enter coupon"
                className="h-10 rounded-xl"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Tax type</span>
              <select
                className="h-10 w-full rounded-xl border border-input bg-background px-3"
                value={taxType}
                onChange={(event) =>
                  setTax(event.target.value as typeof taxType, taxRate)
                }
              >
                {TAX_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TAX_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Tax rate %</span>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={taxRate}
                onChange={(event) =>
                  setTax(taxType, Number(event.target.value) || 0)
                }
                className="h-10 rounded-xl"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Service charge</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={serviceCharge}
                onChange={(event) =>
                  setServiceCharge(Number(event.target.value) || 0)
                }
                className="h-10 rounded-xl"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Payment method</span>
              <select
                className="h-10 w-full rounded-xl border border-input bg-background px-3"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value as typeof paymentMethod
                  )
                }
              >
                {BILL_PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {BILL_PAYMENT_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Bill notes"
            className="mt-3 h-10 rounded-xl"
          />

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">
                {formatBillingMoney(totals.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="tabular-nums">
                {formatBillingMoney(totals.discount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                {totals.taxConfig.label} ({totals.taxConfig.rate}%)
              </dt>
              <dd className="tabular-nums">{formatBillingMoney(totals.tax)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Service charge</dt>
              <dd className="tabular-nums">
                {formatBillingMoney(totals.serviceCharge)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-2 text-base font-semibold">
              <dt>Grand total</dt>
              <dd className="tabular-nums">
                {formatBillingMoney(totals.grandTotal)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-xl"
              disabled={isPending || items.length === 0}
              onClick={checkout}
            >
              Create bill & pay
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                holdOrder();
                toast.success("Hold order", "Placeholder — cart kept locally");
              }}
            >
              <Pause className="size-3.5" />
              Hold order
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={clear}
            >
              Clear
            </Button>
          </div>
        </AppCard>

        <AppCard
          title="Split bill"
          description="Architecture ready — UI placeholder"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {["Split by item", "Split equally", "Custom split"].map((label) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() =>
                  toast.success("Split bill", `${label} coming soon`)
                }
              >
                {label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Merge bills placeholder — multi-bill merge will be available later.
          </p>
        </AppCard>
      </div>
    </div>
  );
}
