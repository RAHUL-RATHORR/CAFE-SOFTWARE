"use client";

import { useState, useMemo } from "react";
import {
  Trash2,
  Plus,
  Minus,
  Percent,
  Tag,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBillingMoney, calculateGstTaxBreakdown, computeDiscountAmount } from "@/lib/billing";
import type { PosCartItem, DiscountType } from "@/types/billing";
import { cn } from "@/lib/utils";

type PosCartProps = {
  items: PosCartItem[];
  onIncrease: (key: string) => void;
  onDecrease: (key: string) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  discountType: DiscountType;
  discountValue: number;
  onSetDiscount: (type: DiscountType, value: number) => void;
  taxRate?: number;
};

export function PosCart({
  items,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onCheckout,
  discountType,
  discountValue,
  onSetDiscount,
  taxRate = 5,
}: PosCartProps) {
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [tempDiscountType, setTempDiscountType] = useState<DiscountType>(discountType);
  const [tempDiscountValue, setTempDiscountValue] = useState(String(discountValue || ""));

  // Calculate cart subtotal
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    return computeDiscountAmount(subtotal, discountType, discountValue);
  }, [subtotal, discountType, discountValue]);

  const taxableBase = Math.max(0, subtotal - discountAmount);

  // Calculate GST tax breakdown
  const gst = useMemo(() => {
    return calculateGstTaxBreakdown({
      taxableAmount: taxableBase,
      taxRate,
      taxMode: "exclusive",
    });
  }, [taxableBase, taxRate]);

  const grandTotal = Math.round((taxableBase + gst.totalTax + Number.EPSILON) * 100) / 100;
  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  function handleApplyDiscount() {
    const num = Math.max(0, parseFloat(tempDiscountValue) || 0);
    onSetDiscount(tempDiscountType, num);
    setShowDiscountDialog(false);
  }

  return (
    <div className="flex h-full flex-col bg-card border-l border-border select-none">
      {/* Cart Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Current Order</h2>
          {itemCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground font-mono">
              {itemCount}
            </span>
          )}
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors py-1 px-2 rounded-lg hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/40 mb-3 text-muted-foreground/60">
              <Receipt className="size-7" />
            </div>
            <p className="text-sm font-bold text-foreground">Order cart is empty</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-50">
              Tap menu items on the left to add them to this ticket.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const lineTotal = item.price * item.quantity;
            return (
              <div
                key={item.key}
                className="flex flex-col gap-1 rounded-xl border border-border/60 bg-background p-2.5 shadow-sm hover:border-border transition-colors"
              >
                {/* Item title & line total */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {formatBillingMoney(item.price)} each
                    </p>
                  </div>
                  <span className="text-xs font-bold text-foreground font-mono">
                    {formatBillingMoney(lineTotal)}
                  </span>
                </div>

                {/* Customizations tags */}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {item.customizations.map((c, i) => (
                      <span
                        key={i}
                        className="rounded bg-accent/60 px-1 py-0.2 text-[9px] text-accent-foreground font-semibold"
                      >
                        +{c.optionName} ({formatBillingMoney(c.priceDelta)})
                      </span>
                    ))}
                  </div>
                )}

                {/* Item Notes */}
                {item.notes && (
                  <p className="text-[10px] italic text-amber-600 font-medium">
                    Note: {item.notes}
                  </p>
                )}

                {/* Quantity adjustments & Remove */}
                <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDecrease(item.key)}
                      className="flex size-7 items-center justify-center rounded-md border border-border/80 bg-muted/40 text-foreground hover:bg-muted active:scale-95 transition-transform"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="min-w-6 text-center text-xs font-bold font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrease(item.key)}
                      className="flex size-7 items-center justify-center rounded-md border border-border/80 bg-muted/40 text-foreground hover:bg-muted active:scale-95 transition-transform"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(item.key)}
                    className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Actions */}
      <div className="border-t border-border bg-muted/15 p-3.5 space-y-3">
        {/* Discount Trigger / Badge */}
        <div className="flex items-center justify-between">
          {discountAmount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setTempDiscountType(discountType);
                setTempDiscountValue(String(discountValue));
                setShowDiscountDialog(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-500/25 transition-colors"
            >
              <Tag className="size-3" />
              Discount ({discountType === "percentage" ? `${discountValue}%` : `₹${discountValue}`}): -{formatBillingMoney(discountAmount)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempDiscountType("percentage");
                setTempDiscountValue("");
                setShowDiscountDialog(true);
              }}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-40 disabled:no-underline"
            >
              <Percent className="size-3" />
              Apply Discount
            </button>
          )}

          <span className="text-[11px] text-muted-foreground">
            GST: {taxRate}% (CGST {gst.cgstRate}% + SGST {gst.sgstRate}%)
          </span>
        </div>

        {/* Breakdown Rows */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono">{formatBillingMoney(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount</span>
              <span className="font-mono">-{formatBillingMoney(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Taxable Base</span>
            <span className="font-mono">{formatBillingMoney(taxableBase)}</span>
          </div>

          <div className="flex justify-between">
            <span>CGST ({gst.cgstRate}%)</span>
            <span className="font-mono">{formatBillingMoney(gst.cgstAmount)}</span>
          </div>

          <div className="flex justify-between">
            <span>SGST ({gst.sgstRate}%)</span>
            <span className="font-mono">{formatBillingMoney(gst.sgstAmount)}</span>
          </div>
        </div>

        {/* Grand Total Bar */}
        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <span className="text-sm font-extrabold text-foreground">Grand Total</span>
          <span className="text-lg font-black text-foreground font-mono">
            {formatBillingMoney(grandTotal)}
          </span>
        </div>

        {/* Primary Checkout Button */}
        <Button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="h-12 w-full text-base font-extrabold tracking-wide rounded-xl shadow-lg active:scale-[0.98] transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Proceed to Pay • {formatBillingMoney(grandTotal)}
        </Button>
      </div>

      {/* Inline Discount Dialog */}
      {showDiscountDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Apply Order Discount</h3>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTempDiscountType("percentage")}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-colors",
                  tempDiscountType === "percentage"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-muted/40 text-foreground"
                )}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setTempDiscountType("fixed")}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border transition-colors",
                  tempDiscountType === "fixed"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-muted/40 text-foreground"
                )}
              >
                Fixed Amount (₹)
              </button>
            </div>

            {/* Value Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                {tempDiscountType === "percentage" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
              </label>
              <input
                type="number"
                min={0}
                max={tempDiscountType === "percentage" ? 100 : subtotal}
                step="any"
                placeholder={tempDiscountType === "percentage" ? "e.g. 10" : "e.g. 50"}
                value={tempDiscountValue}
                onChange={(e) => setTempDiscountValue(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Dialog Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  onSetDiscount("fixed", 0);
                  setShowDiscountDialog(false);
                }}
                className="text-xs font-semibold text-destructive hover:underline"
              >
                Remove Discount
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscountDialog(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleApplyDiscount} className="rounded-xl font-bold">
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
