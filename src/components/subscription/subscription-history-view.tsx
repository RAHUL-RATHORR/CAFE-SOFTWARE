"use client";

import type { ReactNode } from "react";
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
  SAAS_STATUS_LABELS,
  SAAS_STATUS_VARIANTS,
} from "@/config/subscription";
import { formatMoney, formatSubscriptionDate } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import type {
  InvoiceFoundation,
  RestaurantSubscription,
} from "@/types/subscription";

type SubscriptionHistoryViewProps = {
  subscription: RestaurantSubscription | null;
  invoices: InvoiceFoundation[];
  errorMessage?: string | null;
};

export function SubscriptionHistoryView({
  subscription,
  invoices,
  errorMessage,
}: SubscriptionHistoryViewProps) {
  return (
    <PageContainer
      title="Subscription history"
      description="Renewals, cancellations, and invoice timeline foundations."
      actions={
        <Link
          href="/subscription/billing"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          Billing
        </Link>
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <AppCard title="Subscription timeline" description="Current record">
          {!subscription ? (
            <p className="text-sm text-muted-foreground">
              No subscription history yet.
            </p>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              <Item label="Plan" value={subscription.planName || "—"} />
              <Item
                label="Status"
                value={
                  <DsBadge
                    variant={SAAS_STATUS_VARIANTS[subscription.status]}
                    size="sm"
                  >
                    {SAAS_STATUS_LABELS[subscription.status]}
                  </DsBadge>
                }
              />
              <Item
                label="Billing cycle"
                value={BILLING_CYCLE_LABELS[subscription.billingCycle]}
              />
              <Item
                label="Trial"
                value={`${formatSubscriptionDate(subscription.trialStart)} → ${formatSubscriptionDate(subscription.trialEnd)}`}
              />
              <Item
                label="Subscription"
                value={`${formatSubscriptionDate(subscription.subscriptionStart)} → ${formatSubscriptionDate(subscription.subscriptionEnd)}`}
              />
              <Item
                label="Cancelled at"
                value={formatSubscriptionDate(subscription.cancelledAt)}
              />
              <Item
                label="Created"
                value={formatSubscriptionDate(subscription.createdAt)}
              />
              <Item
                label="Updated"
                value={formatSubscriptionDate(subscription.updatedAt)}
              />
            </dl>
          )}
        </AppCard>

        <AppCard title="Invoice history" description="Chronological invoices">
          {invoices.length === 0 ? (
            <TableEmptyState
              title="No history"
              description="Billing events will appear here as invoices are created."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Created</TableHead>
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
                        <DsBadge
                          variant={INVOICE_STATUS_VARIANTS[invoice.status]}
                          size="sm"
                        >
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </DsBadge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatSubscriptionDate(invoice.paidAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatSubscriptionDate(invoice.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AppCard>
      </div>
    </PageContainer>
  );
}

function Item({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
