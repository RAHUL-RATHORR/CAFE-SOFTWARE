"use client";

import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { TableEmptyState } from "@/components/tables/table-empty-state";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BILLING_CYCLE_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_VARIANTS,
} from "@/config/subscription";
import { formatMoney, formatSubscriptionDate } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import type { InvoiceFoundation } from "@/types/subscription";

type SubscriptionBillingViewProps = {
  invoices: InvoiceFoundation[];
  errorMessage?: string | null;
};

export function SubscriptionBillingView({
  invoices,
  errorMessage,
}: SubscriptionBillingViewProps) {
  return (
    <PageContainer
      title="Billing"
      description="Invoice foundation — payments, refunds, coupons, and taxes are placeholders."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/subscription/history"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            History
          </Link>
          <Link
            href="/subscription"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Dashboard
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <AppCard
          title="Invoices"
          description="No Stripe / Razorpay / PayPal integration — local records only"
        >
          {invoices.length === 0 ? (
            <TableEmptyState
              title="No invoices"
              description="Assign or renew a plan to generate invoice foundations."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Issued</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {formatMoney(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        {BILLING_CYCLE_LABELS[invoice.billingCycle]}
                      </TableCell>
                      <TableCell>
                        <DsBadge
                          variant={INVOICE_STATUS_VARIANTS[invoice.status]}
                          size="sm"
                        >
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </DsBadge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatSubscriptionDate(invoice.periodStart)} –{" "}
                        {formatSubscriptionDate(invoice.periodEnd)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatSubscriptionDate(invoice.issuedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AppCard>

        <div className="grid gap-4 md:grid-cols-3">
          <AppCard title="Payments" description="Gateway placeholder">
            <p className="text-sm text-muted-foreground">
              Payment capture is not connected. Records stay local.
            </p>
          </AppCard>
          <AppCard title="Refunds" description="Refund placeholder">
            <p className="text-sm text-muted-foreground">
              Refund workflows will attach to invoice foundations later.
            </p>
          </AppCard>
          <AppCard title="Coupons & taxes" description="Placeholder">
            <p className="text-sm text-muted-foreground">
              Coupon and tax fields exist on invoices for future use.
            </p>
          </AppCard>
        </div>
      </div>
    </PageContainer>
  );
}
