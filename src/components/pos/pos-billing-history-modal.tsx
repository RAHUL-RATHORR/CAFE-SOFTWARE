"use client";

import { useEffect, useState, useTransition } from "react";
import {
  History,
  Search,
  Printer,
  X,
  RotateCcw,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBillingMoney, formatBillingDate } from "@/lib/billing";
import { getPosBillingHistory, refundPosBill } from "@/actions/billing";
import { toast } from "@/store/toast-store";
import type { Bill } from "@/types/billing";
import { cn } from "@/lib/utils";

type PosBillingHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectReprint: (bill: Bill) => void;
};

export function PosBillingHistoryModal({
  isOpen,
  onClose,
  onSelectReprint,
}: PosBillingHistoryModalProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  // Refund dialog state
  const [refundTarget, setRefundTarget] = useState<Bill | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, startRefundTransition] = useTransition();

  function loadHistory(q = "") {
    startTransition(async () => {
      const res = await getPosBillingHistory({
        q: q.trim(),
        pageSize: 30,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (res.success) {
        setBills(res.data.items);
      }
    });
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadHistory(searchTerm);
  }

  function handleConfirmRefund() {
    if (!refundTarget) return;
    if (!refundReason.trim()) {
      toast.error("Please enter a reason for the refund / void");
      return;
    }

    startRefundTransition(async () => {
      const res = await refundPosBill({
        billId: refundTarget.id,
        reason: refundReason.trim(),
      });

      if (!res.success) {
        toast.error(res.error.message || "Failed to refund bill");
        return;
      }

      toast.success("Bill refunded / voided successfully");
      setRefundTarget(null);
      setRefundReason("");
      loadHistory(searchTerm);
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Billing History & Reprints</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-border p-4 bg-background">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by invoice number (e.g. INV-000001) or order #…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/20 pl-9 pr-4 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" size="sm" className="rounded-xl font-bold">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                loadHistory("");
              }}
              className="rounded-xl"
            >
              <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
            </Button>
          </form>
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {isPending && bills.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-xs text-muted-foreground animate-pulse">Loading billing records…</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
              <AlertCircle className="size-8 mb-2 opacity-50" />
              <p className="text-sm font-semibold">No bills found</p>
              <p className="text-xs">Try searching for another invoice number or clear search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        {bill.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">
                        {bill.orderNumber || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {formatBillingDate(bill.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        {formatBillingMoney(bill.grandTotal)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                            bill.paymentStatus === "paid" && "bg-emerald-500/15 text-emerald-600",
                            bill.paymentStatus === "partially-paid" && "bg-amber-500/15 text-amber-600",
                            bill.paymentStatus === "pending" && "bg-muted text-muted-foreground",
                            bill.paymentStatus === "refunded" && "bg-destructive/15 text-destructive"
                          )}
                        >
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 uppercase font-medium text-muted-foreground text-[11px]">
                        {bill.paymentMethod}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectReprint(bill)}
                          className="h-7 px-2 text-[11px] font-bold rounded-lg"
                        >
                          <Printer className="size-3 mr-1" />
                          Reprint
                        </Button>

                        {bill.paymentStatus !== "refunded" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRefundTarget(bill);
                              setRefundReason("");
                            }}
                            className="h-7 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <RotateCcw className="size-3 mr-1" />
                            Void
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border bg-muted/20 px-6 py-3">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>

        {/* Refund Dialog */}
        {refundTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-destructive flex items-center gap-1.5">
                <AlertCircle className="size-4" />
                Void / Refund Invoice {refundTarget.invoiceNumber}
              </h3>
              <p className="text-xs text-muted-foreground">
                This action marks the invoice as refunded without deleting financial history.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Reason for Refund
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer cancelled, food issue, wrong table"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefundTarget(null)}
                  disabled={isRefunding}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmRefund}
                  disabled={isRefunding}
                  className="rounded-xl font-bold"
                >
                  {isRefunding ? "Processing…" : "Confirm Void"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
