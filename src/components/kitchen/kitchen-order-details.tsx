"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import {
  completeKitchenOrder,
  updateKitchenOrderStatus,
  updateKitchenPriority,
} from "@/actions/kitchen";
import {
  ORDER_PRIORITY_LABELS,
  ORDER_PRIORITY_VARIANTS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
  ORDER_TYPE_LABELS,
} from "@/config/orders";
import { formatOrderDate } from "@/lib/orders";
import { nextKitchenStatus } from "@/lib/kitchen";
import { useKitchenElapsed } from "@/hooks/kitchen";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { KitchenTicket } from "@/types/kitchen";
import { ORDER_PRIORITIES, ORDER_STATUSES } from "@/types/order";
import type { OrderPriority, RestaurantOrderStatus } from "@/types/order";

type KitchenOrderDetailsProps = {
  ticket: KitchenTicket;
};

export function KitchenOrderDetails({ ticket }: KitchenOrderDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const elapsed = useKitchenElapsed(ticket.createdAt);
  const canUpdate = useHasPermission([
    "kitchen.update",
    "kitchen.manage",
    "kitchen.edit",
  ]);
  const canComplete = useHasPermission([
    "kitchen.complete",
    "kitchen.manage",
  ]);

  const nextStatus = nextKitchenStatus(ticket.status);

  function setStatus(status: RestaurantOrderStatus) {
    startTransition(async () => {
      const result = await updateKitchenOrderStatus({
        id: ticket.id,
        status,
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Status updated", ORDER_STATUS_LABELS[result.data.status]);
      router.refresh();
    });
  }

  function setPriority(priority: OrderPriority) {
    startTransition(async () => {
      const result = await updateKitchenPriority({
        id: ticket.id,
        priority,
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        "Priority updated",
        ORDER_PRIORITY_LABELS[result.data.priority]
      );
      router.refresh();
    });
  }

  function markComplete() {
    startTransition(async () => {
      const result = await completeKitchenOrder({ id: ticket.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Order completed", ticket.orderNumber);
      router.push("/kitchen");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[1.35fr_0.85fr]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <AppCard
          title={ticket.orderNumber}
          description={`${ORDER_TYPE_LABELS[ticket.orderType]} · Elapsed ${elapsed}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <DsBadge variant={ORDER_STATUS_VARIANTS[ticket.status]} size="sm">
                {ORDER_STATUS_LABELS[ticket.status]}
              </DsBadge>
              <DsBadge
                variant={ORDER_PRIORITY_VARIANTS[ticket.priority]}
                size="sm"
              >
                {ORDER_PRIORITY_LABELS[ticket.priority]}
              </DsBadge>
              <Link
                href="/kitchen"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-xl"
                )}
              >
                <ArrowLeft className="size-3.5" />
                Board
              </Link>
            </div>
          }
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Customer" value={ticket.customerLabel ?? "—"} />
            <DetailItem label="Table" value={ticket.tableLabel ?? "—"} />
            <DetailItem
              label="Chef"
              value={ticket.assignedChefLabel ?? "Unassigned"}
            />
            <DetailItem label="Items" value={`${ticket.itemCount}`} />
            <DetailItem
              label="Created"
              value={formatOrderDate(ticket.createdAt)}
            />
            <DetailItem
              label="Updated"
              value={formatOrderDate(ticket.updatedAt)}
            />
          </dl>

          {ticket.notes ? (
            <NoteBlock title="Notes" body={ticket.notes} />
          ) : null}
          {ticket.kitchenNotes ? (
            <NoteBlock title="Kitchen notes" body={ticket.kitchenNotes} />
          ) : null}

          <div className="mt-4 rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            Modifiers placeholder — item modifiers will appear here in a later
            release.
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {canUpdate.allowed && nextStatus ? (
              <Button
                type="button"
                className="rounded-xl"
                disabled={isPending}
                onClick={() => setStatus(nextStatus)}
              >
                Advance to {ORDER_STATUS_LABELS[nextStatus]}
              </Button>
            ) : null}
            {canComplete.allowed && ticket.status !== "completed" ? (
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                disabled={isPending}
                onClick={markComplete}
              >
                Complete order
              </Button>
            ) : null}
          </div>
        </AppCard>

        <AppCard title="Items" description="Prep list for this ticket">
          <ul className="space-y-2">
            {ticket.items.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="rounded-xl border border-border/70 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      <span className="tabular-nums">{item.quantity}×</span>{" "}
                      {item.name}
                    </p>
                    {item.notes ? (
                      <p className="text-xs text-muted-foreground">
                        {item.notes}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Modifiers: none (placeholder)
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </AppCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        <AppCard title="Kitchen timeline" description="Preparation workflow">
          <OrderTimeline
            status={ticket.status}
            history={ticket.statusHistory}
            createdAt={ticket.createdAt}
          />
        </AppCard>

        {canUpdate.allowed ? (
          <AppCard title="Quick status" description="Update ticket workflow">
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={ticket.status === status ? "secondary" : "outline"}
                  className="rounded-xl"
                  disabled={isPending || ticket.status === status}
                  onClick={() => setStatus(status)}
                >
                  {ORDER_STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </AppCard>
        ) : null}

        {canUpdate.allowed ? (
          <AppCard title="Priority" description="Bump ticket urgency">
            <div className="flex flex-wrap gap-2">
              {ORDER_PRIORITIES.map((priority) => (
                <Button
                  key={priority}
                  type="button"
                  size="sm"
                  variant={
                    ticket.priority === priority ? "secondary" : "outline"
                  }
                  className="rounded-xl"
                  disabled={isPending || ticket.priority === priority}
                  onClick={() => setPriority(priority)}
                >
                  {ORDER_PRIORITY_LABELS[priority]}
                </Button>
              ))}
            </div>
          </AppCard>
        ) : null}

        <AppCard title="Audit" description="Status history and actors">
          {ticket.statusHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <ul className="space-y-3">
              {[...ticket.statusHistory].reverse().map((entry, index) => (
                <li
                  key={`${entry.status}-${entry.changedAt}-${index}`}
                  className="rounded-xl border border-border/70 px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {ORDER_STATUS_LABELS[entry.status]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatOrderDate(entry.changedAt)}
                    {entry.changedBy ? ` · ${entry.changedBy}` : ""}
                  </p>
                  {entry.note ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </motion.div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

function NoteBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p>{body}</p>
    </div>
  );
}
