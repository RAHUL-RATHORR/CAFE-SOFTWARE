"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { CustomerTimeline } from "@/components/customers/customer-timeline";
import {
  addCustomerNote,
  deleteCustomer,
  updateCustomerStatus,
} from "@/actions/customers";
import {
  CUSTOMER_GENDER_LABELS,
  CUSTOMER_PREFERRED_ORDER_TYPE_LABELS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_VARIANTS,
  LOYALTY_TIER_PLACEHOLDERS,
} from "@/config/customers";
import {
  formatCustomerDate,
  formatCustomerDateTime,
  formatCustomerMoney,
} from "@/lib/customers";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type {
  CustomerProfile,
  CustomerStatus,
} from "@/types/customer";

type CustomerProfileViewProps = {
  profile: CustomerProfile;
};

export function CustomerProfileView({ profile }: CustomerProfileViewProps) {
  const { customer, orderHistory, visitHistory, billingSummary } = profile;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [noteBody, setNoteBody] = useState("");
  const [statusValue, setStatusValue] = useState<CustomerStatus>(
    customer.status
  );

  const canEdit = useHasPermission(["customers.edit", "customers.manage"]);
  const canDelete = useHasPermission([
    "customers.delete",
    "customers.manage",
  ]);

  function handleDelete() {
    openConfirmDialog("delete", {
      title: `Delete “${customer.fullName}”?`,
      description: "This customer will be soft-deleted and removed from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deleteCustomer({ id: customer.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Customer deleted", customer.fullName);
        router.push("/customers");
        router.refresh();
      },
    });
  }

  function handleStatusChange(next: CustomerStatus) {
    setStatusValue(next);
    startTransition(async () => {
      const result = await updateCustomerStatus({
        id: customer.id,
        status: next,
      });
      if (!result.success) {
        setStatusValue(customer.status);
        toast.error(result.error.message);
        return;
      }
      toast.success("Status updated", CUSTOMER_STATUS_LABELS[result.data.status]);
      router.refresh();
    });
  }

  function handleAddNote() {
    if (!noteBody.trim()) {
      toast.error("Note is required");
      return;
    }
    startTransition(async () => {
      const result = await addCustomerNote({
        id: customer.id,
        body: noteBody.trim(),
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Note added");
      setNoteBody("");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <AppCard
          title={customer.fullName}
          description={`${customer.customerCode} · ${customer.phone}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <DsBadge
                variant={CUSTOMER_STATUS_VARIANTS[customer.status]}
                size="sm"
              >
                {CUSTOMER_STATUS_LABELS[customer.status]}
              </DsBadge>
              {canEdit.allowed ? (
                <Link
                  href={`/customers/${customer.id}/edit`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-xl"
                  )}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              ) : null}
            </div>
          }
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Email" value={customer.email || "—"} />
            <DetailItem label="Phone" value={customer.phone} />
            <DetailItem
              label="Gender"
              value={
                customer.gender
                  ? CUSTOMER_GENDER_LABELS[customer.gender]
                  : "—"
              }
            />
            <DetailItem
              label="Date of birth"
              value={formatCustomerDate(customer.dateOfBirth)}
            />
            <DetailItem
              label="Anniversary"
              value={formatCustomerDate(customer.anniversary)}
            />
            <DetailItem
              label="Preferred order"
              value={
                CUSTOMER_PREFERRED_ORDER_TYPE_LABELS[
                  customer.preferredOrderType
                ]
              }
            />
            <DetailItem
              label="Created"
              value={formatCustomerDateTime(customer.createdAt)}
            />
            <DetailItem
              label="Updated"
              value={formatCustomerDateTime(customer.updatedAt)}
            />
          </dl>

          {customer.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {customer.tags.map((tag) => (
                <DsBadge key={tag} variant="secondary" size="sm">
                  {tag}
                </DsBadge>
              ))}
            </div>
          ) : null}

          {canEdit.allowed ? (
            <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-border/60 pt-4">
              <div className="min-w-[160px] space-y-1.5">
                <label
                  htmlFor="customer-status"
                  className="text-xs text-muted-foreground"
                >
                  Status
                </label>
                <select
                  id="customer-status"
                  value={statusValue}
                  disabled={isPending}
                  className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  onChange={(event) =>
                    handleStatusChange(event.target.value as CustomerStatus)
                  }
                >
                  {(
                    Object.keys(CUSTOMER_STATUS_LABELS) as CustomerStatus[]
                  ).map((status) => (
                    <option key={status} value={status}>
                      {CUSTOMER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Link
              href="/customers"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl"
              )}
            >
              Back to list
            </Link>
            {canDelete.allowed ? (
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </AppCard>

        <AppCard title="Addresses" description="Address book">
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No addresses saved.</p>
          ) : (
            <ul className="space-y-3">
              {customer.addresses.map((address, index) => (
                <li
                  key={`${address.label}-${index}`}
                  className="rounded-xl border border-border/70 p-3 text-sm"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium">{address.label}</span>
                    {address.isDefault ? (
                      <DsBadge variant="secondary" size="sm">
                        Default
                      </DsBadge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground">
                    {[
                      address.addressLine1,
                      address.addressLine2,
                      address.city,
                      address.state,
                      address.postalCode,
                      address.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                  {address.landmark ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Landmark: {address.landmark}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </AppCard>

        <AppCard title="Order history" description="Linked from Orders module">
          {orderHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border/70">
              {orderHistory.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {order.orderType} · {order.status} ·{" "}
                      {formatCustomerDateTime(order.createdAt)}
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatCustomerMoney(order.grandTotal)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AppCard>

        <AppCard title="Visit history" description="Derived from orders and bills">
          {visitHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits recorded.</p>
          ) : (
            <ul className="divide-y divide-border/70">
              {visitHistory.map((visit) => (
                <li
                  key={visit.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <span>{visit.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCustomerDateTime(visit.occurredAt)} · {visit.source}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </div>

      <div className="space-y-4">
        <AppCard title="Loyalty summary" description="Foundation only">
          <dl className="grid gap-3">
            <DetailItem
              label="Points"
              value={String(customer.loyalty.points)}
            />
            <DetailItem
              label="Reward level"
              value={customer.loyalty.rewardLevel ?? "—"}
            />
            <DetailItem
              label="Membership tier"
              value={customer.loyalty.membershipTier ?? "—"}
            />
            <DetailItem
              label="Referral code"
              value={customer.loyalty.referralCode ?? "—"}
              mono
            />
          </dl>
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-3">
            <p className="text-xs font-medium">Upcoming tiers</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {LOYALTY_TIER_PLACEHOLDERS.map((tier) => (
                <li key={tier.id}>
                  {tier.label} · {tier.minPoints}+ pts
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Coupons and referral rewards are placeholders for a later module.
            </p>
          </div>
        </AppCard>

        <AppCard title="Billing summary" description="Linked from Billing module">
          <dl className="grid gap-3">
            <DetailItem
              label="Bills"
              value={String(billingSummary.billsCount)}
            />
            <DetailItem
              label="Total billed"
              value={formatCustomerMoney(billingSummary.totalBilled)}
            />
            <DetailItem
              label="Total paid"
              value={formatCustomerMoney(billingSummary.totalPaid)}
            />
            <DetailItem
              label="Last invoice"
              value={billingSummary.lastInvoiceNumber ?? "—"}
              mono
            />
          </dl>
        </AppCard>

        <AppCard title="Notes">
          {customer.notes ? (
            <p className="mb-4 text-sm leading-relaxed">{customer.notes}</p>
          ) : null}
          {customer.noteEntries.length > 0 ? (
            <ul className="mb-4 space-y-3 border-b border-border/60 pb-4">
              {customer.noteEntries.map((note) => (
                <li key={note.id} className="text-sm">
                  <p>{note.body}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatCustomerDateTime(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            !customer.notes && (
              <p className="mb-4 text-sm text-muted-foreground">
                No notes yet.
              </p>
            )
          )}
          {canEdit.allowed ? (
            <div className="space-y-2">
              <textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                placeholder="Add a note…"
                rows={3}
                className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                disabled={isPending}
                onClick={handleAddNote}
              >
                Add note
              </Button>
            </div>
          ) : null}
        </AppCard>

        <AppCard title="Timeline" description="Status history">
          <CustomerTimeline
            history={customer.statusHistory}
            createdAt={customer.createdAt}
          />
        </AppCard>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value: string;
  mono?: boolean;
  children?: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-sm font-medium",
          mono && "font-mono text-xs text-muted-foreground"
        )}
      >
        {children ?? value}
      </dd>
    </div>
  );
}
