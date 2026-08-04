"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { Clock3, UtensilsCrossed } from "lucide-react";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ORDER_PRIORITY_LABELS,
  ORDER_PRIORITY_VARIANTS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
  ORDER_TYPE_LABELS,
} from "@/config/orders";
import {
  completeKitchenOrder,
  updateKitchenOrderStatus,
} from "@/actions/kitchen";
import { nextKitchenStatus } from "@/lib/kitchen";
import { useKitchenElapsed } from "@/hooks/kitchen";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { KitchenTicket } from "@/types/kitchen";

type KitchenTicketCardProps = {
  ticket: KitchenTicket;
  compact?: boolean;
};

export function KitchenTicketCard({
  ticket,
  compact = false,
}: KitchenTicketCardProps) {
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

  function advanceStatus() {
    if (!nextStatus) return;
    startTransition(async () => {
      const result = await updateKitchenOrderStatus({
        id: ticket.id,
        status: nextStatus,
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Status updated", ORDER_STATUS_LABELS[result.data.status]);
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
      router.refresh();
    });
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "rounded-xl border border-border/80 bg-card p-3 shadow-sm",
        ticket.priority === "urgent" && "border-destructive/40",
        ticket.priority === "high" && "border-warning/40"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <Link
            href={`/kitchen/${ticket.id}`}
            className="font-semibold tracking-tight hover:underline"
          >
            {ticket.orderNumber}
          </Link>
          <p className="text-xs text-muted-foreground">
            {ORDER_TYPE_LABELS[ticket.orderType]}
            {ticket.tableLabel ? ` · ${ticket.tableLabel}` : ""}
          </p>
        </div>
        <DsBadge variant={ORDER_PRIORITY_VARIANTS[ticket.priority]} size="sm">
          {ORDER_PRIORITY_LABELS[ticket.priority]}
        </DsBadge>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <DsBadge variant={ORDER_STATUS_VARIANTS[ticket.status]} size="sm">
          {ORDER_STATUS_LABELS[ticket.status]}
        </DsBadge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3" />
          {elapsed}
        </span>
      </div>

      <p className="mb-1 text-xs text-muted-foreground">
        {ticket.customerLabel ?? "Walk-in"} · {ticket.itemCount} items
      </p>

      {!compact ? (
        <ul className="mb-2 space-y-1 text-sm">
          {ticket.items.slice(0, 4).map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex items-start justify-between gap-2"
            >
              <span className="min-w-0 truncate">
                <span className="font-medium tabular-nums">{item.quantity}×</span>{" "}
                {item.name}
              </span>
            </li>
          ))}
          {ticket.items.length > 4 ? (
            <li className="text-xs text-muted-foreground">
              +{ticket.items.length - 4} more
            </li>
          ) : null}
        </ul>
      ) : null}

      {ticket.kitchenNotes ? (
        <p className="mb-2 rounded-lg bg-muted/50 px-2 py-1.5 text-xs">
          <span className="font-medium">Kitchen:</span> {ticket.kitchenNotes}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={`/kitchen/${ticket.id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-xl"
          )}
        >
          <UtensilsCrossed className="size-3.5" />
          Details
        </Link>
        {canUpdate.allowed && nextStatus ? (
          <Button
            type="button"
            size="sm"
            className="rounded-xl"
            disabled={isPending}
            onClick={advanceStatus}
          >
            → {ORDER_STATUS_LABELS[nextStatus]}
          </Button>
        ) : null}
        {canComplete.allowed && ticket.status !== "completed" ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="rounded-xl"
            disabled={isPending}
            onClick={markComplete}
          >
            Complete
          </Button>
        ) : null}
      </div>
    </motion.article>
  );
}
