"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, Mail, Printer } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { Input } from "@/components/ui/input";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import {
  createPayment,
  refundPayment,
} from "@/actions/billing";
import {
  BILL_PAYMENT_METHOD_LABELS,
  BILL_PAYMENT_STATUS_LABELS,
  BILL_PAYMENT_STATUS_VARIANTS,
} from "@/config/billing";
import { formatBillingDate, formatBillingMoney } from "@/lib/billing";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { Bill, BillPaymentMethod, Payment } from "@/types/billing";
import { BILL_PAYMENT_METHODS } from "@/types/billing";

type BillDetailsProps = {
  bill: Bill;
  payments: Payment[];
};

export function BillDetails({ bill, payments }: BillDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(
    bill.amountDue > 0 ? String(bill.amountDue) : ""
  );
  const [method, setMethod] = useState<BillPaymentMethod>(
    bill.paymentMethod === "multiple" ? "cash" : bill.paymentMethod
  );

  const canPay = useHasPermission([
    "billing.create",
    "billing.edit",
    "billing.manage",
  ]);
  const canRefund = useHasPermission(["billing.refund", "billing.manage"]);
  const canPrint = useHasPermission(["billing.print", "billing.manage"]);

  function handlePayment() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    startTransition(async () => {
      const result = await createPayment({
        billId: bill.id,
        amount: value,
        method,
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Payment recorded", formatBillingMoney(result.data.amount));
      router.refresh();
    });
  }

  function handleRefund(payment: Payment) {
    openConfirmDialog("delete", {
      title: "Refund this payment?",
      description: `Refund ${formatBillingMoney(payment.amount)} for ${bill.invoiceNumber}.`,
      confirmLabel: "Refund",
      onConfirm: async () => {
        const result = await refundPayment({ paymentId: payment.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Payment refunded");
        router.refresh();
      },
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-4">
        <AppCard
          title={bill.invoiceNumber}
          description={
            bill.orderNumber
              ? `Linked order ${bill.orderNumber}`
              : "Standalone POS bill"
          }
          action={
            <div className="flex flex-wrap gap-2">
              <DsBadge
                variant={BILL_PAYMENT_STATUS_VARIANTS[bill.paymentStatus]}
                size="sm"
              >
                {BILL_PAYMENT_STATUS_LABELS[bill.paymentStatus]}
              </DsBadge>
              <Link
                href={`/billing/${bill.id}/invoice`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-xl"
                )}
              >
                <FileText className="size-3.5" />
                Invoice
              </Link>
            </div>
          }
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Customer" value={bill.customerLabel ?? "—"} />
            <DetailItem
              label="Method"
              value={BILL_PAYMENT_METHOD_LABELS[bill.paymentMethod]}
            />
            <DetailItem
              label="Created"
              value={formatBillingDate(bill.createdAt)}
            />
            <DetailItem label="Cashier" value={bill.cashierId ?? "—"} mono />
          </dl>

          {bill.notes ? (
            <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
              {bill.notes}
            </div>
          ) : null}
        </AppCard>

        <AppCard title="Items" description="Billed line items">
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Price</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, index) => (
                  <tr
                    key={`${item.name}-${index}`}
                    className="border-t border-border/60"
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium">{item.name}</p>
                      {item.notes ? (
                        <p className="text-xs text-muted-foreground">
                          {item.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatBillingMoney(item.price)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {formatBillingMoney(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={formatBillingMoney(bill.subtotal)} />
            <Row label="Discount" value={formatBillingMoney(bill.discount)} />
            <Row
              label={`${bill.taxConfig.label} (${bill.taxConfig.rate}%)`}
              value={formatBillingMoney(bill.tax)}
            />
            <Row
              label="Service charge"
              value={formatBillingMoney(bill.serviceCharge)}
            />
            <Row
              label="Grand total"
              value={formatBillingMoney(bill.grandTotal)}
              strong
            />
            <Row label="Paid" value={formatBillingMoney(bill.amountPaid)} />
            <Row label="Due" value={formatBillingMoney(bill.amountDue)} strong />
          </dl>
        </AppCard>
      </div>

      <div className="space-y-4">
        {canPay.allowed && bill.amountDue > 0 ? (
          <AppCard title="Collect payment" description="Record a payment">
            <div className="space-y-3">
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-10 rounded-xl"
                placeholder="Amount"
              />
              <select
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value as BillPaymentMethod)
                }
              >
                {BILL_PAYMENT_METHODS.filter((row) => row !== "multiple").map(
                  (row) => (
                    <option key={row} value={row}>
                      {BILL_PAYMENT_METHOD_LABELS[row]}
                    </option>
                  )
                )}
              </select>
              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={isPending}
                onClick={handlePayment}
              >
                Record payment
              </Button>
            </div>
          </AppCard>
        ) : null}

        <AppCard title="Payments" description="Payment history and refunds">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="space-y-2">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="rounded-xl border border-border/70 px-3 py-2 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {formatBillingMoney(payment.amount)} ·{" "}
                        {BILL_PAYMENT_METHOD_LABELS[payment.method]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBillingDate(payment.createdAt)} · {payment.status}
                      </p>
                    </div>
                    {canRefund.allowed && payment.status === "completed" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => handleRefund(payment)}
                      >
                        Refund
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AppCard>

        <AppCard title="Receipt actions" description="Print / email placeholders">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!canPrint.allowed}
              onClick={() =>
                toast.success("Print receipt", "Printer SDK not connected")
              }
            >
              <Printer className="size-3.5" />
              Print
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                toast.success("Email receipt", "Email delivery coming soon")
              }
            >
              <Mail className="size-3.5" />
              Email
            </Button>
          </div>
        </AppCard>

        <AppCard title="Split / merge" description="Placeholders">
          <p className="text-sm text-muted-foreground">
            Split by item, equal split, and custom split are scaffolded on the
            bill model. Merge bills is reserved for a later release.
          </p>
        </AppCard>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("mt-1 text-sm", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        strong && "border-t border-border pt-2 font-semibold"
      )}
    >
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
