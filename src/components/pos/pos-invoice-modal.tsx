"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Printer,
  PlusCircle,
  X,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBillingMoney } from "@/lib/billing";
import { getPosInvoicePrintData } from "@/actions/billing";
import { printReceiptAction } from "@/actions/printer";
import { PosReceiptPrint } from "@/components/pos/pos-receipt-print";
import { PrinterPreviewModal } from "@/components/printer/printer-preview-modal";
import { toast } from "@/store/toast-store";
import type { InvoicePrintData, PosCheckoutResult } from "@/types/billing";

type PosInvoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onNewOrder: () => void;
  checkoutResult: PosCheckoutResult | null;
  billId?: string | null;
  branchId?: string | null;
  isReprint?: boolean;
};

export function PosInvoiceModal({
  isOpen,
  onClose,
  onNewOrder,
  checkoutResult,
  billId,
  branchId,
  isReprint = false,
}: PosInvoiceModalProps) {
  const [printData, setPrintData] = useState<InvoicePrintData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPrinting, setIsPrinting] = useState(false);

  // Monospace Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewText, setPreviewText] = useState("");

  const targetBillId = billId || checkoutResult?.bill?.id;

  useEffect(() => {
    if (isOpen && targetBillId) {
      startTransition(async () => {
        const res = await getPosInvoicePrintData(targetBillId);
        if (res.success) {
          setPrintData(res.data);
        }
      });
    }
  }, [isOpen, targetBillId]);

  if (!isOpen) return null;

  async function handleThermalPrint() {
    if (!targetBillId) return;
    setIsPrinting(true);

    try {
      const res = await printReceiptAction({
        billId: targetBillId,
        branchId: branchId || undefined,
        isReprint,
      });

      if (res.success && res.data) {
        const result = res.data;
        if (result.status === "PRINTED") {
          toast.success(`Sent to thermal printer (${result.printerName})`);
        } else if (result.status === "QUEUED") {
          toast.info("Print job already queued.");
        } else {
          // Fallback
          toast.warning(
            result.error
              ? `Printer offline (${result.error}). Showing browser thermal preview.`
              : "Printer offline. Showing browser thermal preview."
          );
          setPreviewText(result.previewText);
          setPreviewOpen(true);
        }
      } else {
        toast.error(res.error || "Thermal print failed. Opening browser print.");
        window.print();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Print execution error";
      toast.error(msg);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  }

  async function handleOpenMonospacePreview() {
    if (!targetBillId) return;
    try {
      const res = await printReceiptAction({
        billId: targetBillId,
        branchId: branchId || undefined,
        isReprint,
      });
      if (res.success && res.data) {
        setPreviewText(res.data.previewText);
        setPreviewOpen(true);
      }
    } catch {
      window.print();
    }
  }

  function handleBrowserPrint() {
    window.print();
  }

  return (
    <>
      {/* Hidden thermal receipt for print engine */}
      <PosReceiptPrint data={printData} />

      {/* Monospace Thermal Roll Preview Dialog */}
      <PrinterPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        previewText={previewText}
        title={isReprint ? "Reprint Thermal Receipt Preview" : "Thermal Receipt Preview"}
      />

      {/* Screen view modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
        <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/25">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    Invoice {printData?.invoiceNumber || checkoutResult?.invoiceNumber || "Generated"}
                  </h2>
                  {isReprint && (
                    <span className="bg-amber-500/15 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      DUPLICATE REPRINT
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Order Completed • ESC/POS Thermal Ready
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Invoice Preview Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
            {isPending && !printData ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-xs text-muted-foreground animate-pulse">
                  Formatting invoice details…
                </p>
              </div>
            ) : printData ? (
              <div className="rounded-xl border border-border bg-background p-5 shadow-sm space-y-4">
                {/* Header Info */}
                <div className="flex justify-between items-start border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
                      {printData.restaurantName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">{printData.branchName}</p>
                    {printData.branchAddress && (
                      <p className="text-[10px] text-muted-foreground max-w-55">
                        {printData.branchAddress}
                      </p>
                    )}
                    {printData.gstin && (
                      <p className="text-[10px] font-bold text-primary mt-0.5">
                        GSTIN: {printData.gstin}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                      Tax Invoice
                    </span>
                    <p className="font-mono text-xs font-bold text-foreground mt-1">
                      {printData.invoiceNumber}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(printData.issuedAt).toLocaleString("en-IN")}
                    </p>
                    {printData.tableLabel && (
                      <span className="inline-block mt-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                        {printData.tableLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 font-bold text-muted-foreground border-b border-border pb-1">
                    <span className="col-span-1">Qty</span>
                    <span className="col-span-7">Item</span>
                    <span className="col-span-4 text-right">Amount</span>
                  </div>

                  {printData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 py-1 text-[11px] border-b border-border/40">
                      <span className="col-span-1 font-bold">{item.quantity}×</span>
                      <div className="col-span-7">
                        <span className="font-medium text-foreground">{item.name}</span>
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="text-[10px] text-muted-foreground pl-2">
                            {item.customizations.join(", ")}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[10px] text-amber-600 pl-2">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                      <span className="col-span-4 text-right font-mono font-medium">
                        {formatBillingMoney(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary & GST */}
                <div className="space-y-1.5 border-t border-border pt-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatBillingMoney(printData.subtotal)}</span>
                  </div>

                  {printData.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount ({printData.discountLabel || "Promo"})</span>
                      <span className="font-mono">-{formatBillingMoney(printData.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Amount</span>
                    <span className="font-mono">{formatBillingMoney(printData.taxableAmount)}</span>
                  </div>

                  {printData.gstBreakdown.cgstAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>CGST ({printData.gstBreakdown.cgstRate}%)</span>
                      <span className="font-mono">{formatBillingMoney(printData.gstBreakdown.cgstAmount)}</span>
                    </div>
                  )}

                  {printData.gstBreakdown.sgstAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>SGST ({printData.gstBreakdown.sgstRate}%)</span>
                      <span className="font-mono">{formatBillingMoney(printData.gstBreakdown.sgstAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-border pt-2 text-sm font-extrabold text-foreground">
                    <span>Grand Total</span>
                    <span className="font-mono text-base font-black text-primary">
                      {formatBillingMoney(printData.grandTotal)}
                    </span>
                  </div>

                  {printData.changeGiven > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold pt-1">
                      <span>Change Given</span>
                      <span className="font-mono">{formatBillingMoney(printData.changeGiven)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-border bg-muted/20 px-6 py-4 gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={handleThermalPrint}
                disabled={!printData || isPrinting}
                className="rounded-xl flex items-center gap-1.5 font-bold shadow-sm bg-primary text-primary-foreground text-xs h-9"
              >
                <Printer className={`size-3.5 ${isPrinting ? "animate-spin" : ""}`} />
                {isPrinting ? "Printing..." : isReprint ? "Reprint Receipt" : "Print Receipt"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMonospacePreview}
                disabled={!printData}
                className="rounded-xl flex items-center gap-1 text-xs h-9"
                title="View thermal paper preview"
              >
                <FileText className="size-3.5" />
                Preview
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleBrowserPrint}
                disabled={!printData}
                className="rounded-xl text-xs h-9 text-muted-foreground hover:text-foreground"
              >
                Browser Print
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs h-9"
              >
                Close
              </Button>
              <Button
                onClick={onNewOrder}
                className="rounded-xl flex items-center gap-1.5 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
              >
                <PlusCircle className="size-3.5" />
                New Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
