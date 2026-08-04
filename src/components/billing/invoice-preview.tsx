"use client";

import Link from "next/link";
import { Mail, Printer } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  BILL_PAYMENT_METHOD_LABELS,
  BILL_PAYMENT_STATUS_LABELS,
} from "@/config/billing";
import { formatBillingDate, formatBillingMoney } from "@/lib/billing";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { Invoice, Receipt } from "@/types/billing";

type InvoicePreviewProps = {
  invoice: Invoice;
  receipt: Receipt;
};

export function InvoicePreview({ invoice, receipt }: InvoicePreviewProps) {
  const { bill, payments, issuedAt, restaurantName } = invoice;
  const canPrint = useHasPermission(["billing.print", "billing.manage"]);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <AppCard
        title={`Invoice ${bill.invoiceNumber}`}
        description={`${restaurantName} · Issued ${formatBillingDate(issuedAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/billing/${bill.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl"
              )}
            >
              Back to bill
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              disabled={!canPrint.allowed}
              onClick={() =>
                toast.success("Print invoice", "Printer SDK not connected")
              }
            >
              <Printer className="size-3.5" />
              Print
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                toast.success("Email invoice", "Email delivery coming soon")
              }
            >
              <Mail className="size-3.5" />
              Email
            </Button>
          </div>
        }
      >
        <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{restaurantName}</p>
              <p className="text-sm text-muted-foreground">Tax invoice / receipt</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">{bill.invoiceNumber}</p>
              <p className="text-muted-foreground">
                {BILL_PAYMENT_STATUS_LABELS[bill.paymentStatus]}
              </p>
            </div>
          </div>

          <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Customer:</span>{" "}
              {bill.customerLabel ?? "Walk-in"}
            </p>
            <p>
              <span className="text-muted-foreground">Order:</span>{" "}
              {bill.orderNumber ?? "—"}
            </p>
          </div>

          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, index) => (
                <tr key={`${item.name}-${index}`} className="border-b border-border/60">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatBillingMoney(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">
                {formatBillingMoney(bill.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="tabular-nums">
                {formatBillingMoney(bill.discount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{bill.taxConfig.label}</dt>
              <dd className="tabular-nums">{formatBillingMoney(bill.tax)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Service</dt>
              <dd className="tabular-nums">
                {formatBillingMoney(bill.serviceCharge)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold">
              <dt>Grand total</dt>
              <dd className="tabular-nums">
                {formatBillingMoney(bill.grandTotal)}
              </dd>
            </div>
          </dl>
        </div>
      </AppCard>

      <AppCard title="Receipt preview" description="Guest-facing receipt layout">
        <div className="mx-auto max-w-sm rounded-xl border border-dashed border-border bg-muted/20 p-4 font-mono text-xs">
          <p className="text-center text-sm font-semibold">{restaurantName}</p>
          <p className="mb-3 text-center text-muted-foreground">
            {bill.invoiceNumber}
          </p>
          {bill.items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex justify-between gap-2">
              <span>
                {item.quantity} x {item.name}
              </span>
              <span>{formatBillingMoney(item.subtotal)}</span>
            </div>
          ))}
          <div className="my-2 border-t border-border pt-2">
            <div className="flex justify-between">
              <span>TOTAL</span>
              <span>{formatBillingMoney(bill.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>PAID</span>
              <span>{formatBillingMoney(bill.amountPaid)}</span>
            </div>
          </div>
          {payments.map((payment) => (
            <p key={payment.id} className="text-muted-foreground">
              {BILL_PAYMENT_METHOD_LABELS[payment.method]}{" "}
              {formatBillingMoney(payment.amount)}
            </p>
          ))}
          <p className="mt-3 text-center text-muted-foreground">
            Print: {receipt.delivery.print} · Email: {receipt.delivery.email}
          </p>
        </div>
      </AppCard>
    </div>
  );
}
