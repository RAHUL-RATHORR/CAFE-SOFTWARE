"use client";

import { useState, useMemo, useTransition } from "react";
import {
  X,
  Banknote,
  Smartphone,
  CreditCard,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBillingMoney, calculateCashChange } from "@/lib/billing";
import { checkoutPosOrder } from "@/actions/billing";
import { toast } from "@/store/toast-store";
import type {
  PosCartItem,
  PosPaymentTender,
  PosCheckoutResult,
  GstBreakdown,
  DiscountType,
} from "@/types/billing";
import { cn } from "@/lib/utils";

type PosCheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  tableId: string | null;
  orderType: "dine-in" | "take-away" | "delivery";
  items: PosCartItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  gstBreakdown: GstBreakdown;
  grandTotal: number;
  customerName?: string;
  customerPhone?: string;
  onOrderCompleted: (result: PosCheckoutResult) => void;
};

type PaymentMode = "cash" | "upi" | "card" | "split";

export function PosCheckoutModal({
  isOpen,
  onClose,
  branchId,
  tableId,
  orderType,
  items,
  subtotal,
  discountType,
  discountValue,
  discountAmount,
  gstBreakdown,
  grandTotal,
  customerName = "",
  customerPhone = "",
  onOrderCompleted,
}: PosCheckoutModalProps) {
  const [isPending, startTransition] = useTransition();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");

  // Cash state
  const [cashReceived, setCashReceived] = useState<string>(String(grandTotal));

  // Reference for UPI/Card
  const [paymentReference, setPaymentReference] = useState("");

  // Split payments tenders
  const [splitTenders, setSplitTenders] = useState<
    Array<{ method: "cash" | "upi" | "card" | "other"; amount: string; reference?: string }>
  >([
    { method: "cash", amount: "" },
    { method: "upi", amount: "" },
  ]);

  // Customer info overrides
  const [custName, setCustName] = useState(customerName);
  const [custPhone, setCustPhone] = useState(customerPhone);
  const [orderNotes, setOrderNotes] = useState("");

  // Cash Change Calculation
  const cashChange = useMemo(() => {
    const received = parseFloat(cashReceived) || 0;
    return calculateCashChange(grandTotal, received);
  }, [grandTotal, cashReceived]);

  // Split payments total & remaining
  const splitSummary = useMemo(() => {
    const totalPaid = splitTenders.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const roundedPaid = Math.round((totalPaid + Number.EPSILON) * 100) / 100;
    const remaining = Math.max(0, Math.round((grandTotal - roundedPaid) * 100) / 100);
    const isComplete = roundedPaid >= grandTotal - 0.001;
    return { totalPaid: roundedPaid, remaining, isComplete };
  }, [splitTenders, grandTotal]);

  if (!isOpen) return null;

  // Fast cash buttons presets
  const cashPresets = [
    grandTotal,
    Math.ceil(grandTotal / 50) * 50,
    Math.ceil(grandTotal / 100) * 100,
    500,
    1000,
    2000,
  ].filter((val, idx, arr) => val >= grandTotal && arr.indexOf(val) === idx);

  function handleAddSplitRow() {
    setSplitTenders((prev) => [...prev, { method: "cash", amount: "" }]);
  }

  function handleRemoveSplitRow(index: number) {
    setSplitTenders((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateSplitRow(index: number, field: string, value: string) {
    setSplitTenders((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function handleCompleteCheckout() {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const tenders: PosPaymentTender[] = [];

    if (paymentMode === "cash") {
      const received = parseFloat(cashReceived) || 0;
      if (!cashChange.isValid) {
        toast.error(`Cash received is less than total due (Shortfall: ₹${cashChange.shortfall})`);
        return;
      }
      tenders.push({
        method: "cash",
        amount: grandTotal,
        cashReceived: received,
        changeGiven: cashChange.changeAmount,
      });
    } else if (paymentMode === "upi") {
      tenders.push({
        method: "upi",
        amount: grandTotal,
        reference: paymentReference.trim(),
      });
    } else if (paymentMode === "card") {
      tenders.push({
        method: "card",
        amount: grandTotal,
        reference: paymentReference.trim(),
      });
    } else if (paymentMode === "split") {
      if (!splitSummary.isComplete) {
        toast.error(`Split payment incomplete. Shortfall: ₹${splitSummary.remaining}`);
        return;
      }
      for (const t of splitTenders) {
        const amt = parseFloat(t.amount) || 0;
        if (amt > 0) {
          tenders.push({
            method: t.method,
            amount: amt,
            reference: t.reference?.trim() || "",
          });
        }
      }
    }

    startTransition(async () => {
      const result = await checkoutPosOrder({
        branchId,
        tableId: orderType === "dine-in" ? tableId : null,
        orderType,
        items: items.map((i) => ({
          menuItemId: i.menuItemId!,
          name: i.name,
          quantity: i.quantity,
          notes: i.notes,
          customizations: i.customizations,
        })),
        discountType,
        discountValue,
        paymentTenders: tenders,
        customerName: custName.trim() || undefined,
        customerPhone: custPhone.trim() || undefined,
        notes: orderNotes.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error.message || "Failed to process checkout");
        return;
      }

      toast.success("Order confirmed & invoice generated!");
      onOrderCompleted(result.data);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <h2 className="text-lg font-bold text-foreground">Checkout & Collect Payment</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {orderType.replace("-", " ")} Order • {items.length} Item(s)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Bill Summary Box */}
          <div className="rounded-xl border border-border/80 bg-background p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono">{formatBillingMoney(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
                <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Fixed"}):</span>
                <span className="font-mono">-{formatBillingMoney(discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Taxable Value:</span>
              <span className="font-mono">{formatBillingMoney(gstBreakdown.taxableAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>GST ({gstBreakdown.taxRate}% - CGST {gstBreakdown.cgstRate}% + SGST {gstBreakdown.sgstRate}%):</span>
              <span className="font-mono">{formatBillingMoney(gstBreakdown.totalTax)}</span>
            </div>

            <div className="flex items-baseline justify-between border-t border-border pt-2 text-base font-extrabold text-foreground">
              <span>Total Payable:</span>
              <span className="text-xl font-black text-primary font-mono">
                {formatBillingMoney(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Payment Method
            </label>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode("cash")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 font-bold transition-all text-center",
                  paymentMode === "cash"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted/30 text-foreground hover:bg-muted/60"
                )}
              >
                <Banknote className="size-5" />
                <span className="text-xs">CASH</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("upi")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 font-bold transition-all text-center",
                  paymentMode === "upi"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted/30 text-foreground hover:bg-muted/60"
                )}
              >
                <Smartphone className="size-5" />
                <span className="text-xs">UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("card")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 font-bold transition-all text-center",
                  paymentMode === "card"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted/30 text-foreground hover:bg-muted/60"
                )}
              >
                <CreditCard className="size-5" />
                <span className="text-xs">CARD</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("split")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 font-bold transition-all text-center",
                  paymentMode === "split"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted/30 text-foreground hover:bg-muted/60"
                )}
              >
                <Layers className="size-5" />
                <span className="text-xs">SPLIT</span>
              </button>
            </div>
          </div>

          {/* Payment Method Details Box */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            {/* CASH TENDER VIEW */}
            {paymentMode === "cash" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Cash Received</span>
                  {cashChange.isValid ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      Change: {formatBillingMoney(cashChange.changeAmount)}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3.5" />
                      Shortfall: {formatBillingMoney(cashChange.shortfall)}
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  min={0}
                  step="any"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-lg font-black font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {/* Quick cash denomination buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {cashPresets.map((val, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCashReceived(String(val))}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold font-mono text-foreground hover:bg-muted transition-colors active:scale-95"
                    >
                      {val === grandTotal ? `Exact (₹${val})` : `₹${val}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* UPI VIEW */}
            {paymentMode === "upi" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Ask the customer to scan the restaurant UPI QR code and confirm the transaction.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    UPI Reference / UTR Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 423982390123"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* CARD VIEW */}
            {paymentMode === "card" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Swipe / tap the customer card on the POS EDC terminal.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Card Approval Code / Last 4 Digits (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9821 or TXN-4421"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* SPLIT PAYMENT VIEW */}
            {paymentMode === "split" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Split Tenders</span>
                  <span
                    className={cn(
                      "font-bold font-mono",
                      splitSummary.isComplete ? "text-emerald-600" : "text-amber-500"
                    )}
                  >
                    Paid: {formatBillingMoney(splitSummary.totalPaid)} / Due: {formatBillingMoney(grandTotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  {splitTenders.map((tender, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={tender.method}
                        onChange={(e) =>
                          handleUpdateSplitRow(idx, "method", e.target.value)
                        }
                        className="rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="other">Other</option>
                      </select>

                      <input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Amount"
                        value={tender.amount}
                        onChange={(e) =>
                          handleUpdateSplitRow(idx, "amount", e.target.value)
                        }
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />

                      {splitTenders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSplitRow(idx)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddSplitRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <Plus className="size-3.5" />
                    Add Payment Method
                  </button>

                  {splitSummary.remaining > 0 && (
                    <span className="text-xs font-bold text-amber-500 font-mono">
                      Remaining: {formatBillingMoney(splitSummary.remaining)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Customer Details & Notes (Optional) */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                placeholder="Walk-in Guest"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">
                Order Notes / Special Instructions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Less spicy, pack sauces separately"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl">
            Cancel
          </Button>

          <Button
            onClick={handleCompleteCheckout}
            disabled={
              isPending ||
              (paymentMode === "cash" && !cashChange.isValid) ||
              (paymentMode === "split" && !splitSummary.isComplete)
            }
            className="h-11 px-6 rounded-xl font-bold tracking-wide shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending ? "Generating Invoice…" : `Confirm & Pay ${formatBillingMoney(grandTotal)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
