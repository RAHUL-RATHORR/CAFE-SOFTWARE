"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Flame,
  QrCode,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  acceptKitchenOrder,
  cancelKitchenOrder,
  markReadyKitchenOrder,
  markServedKitchenOrder,
  startPreparingKitchenOrder,
} from "@/actions/kitchen";
import { useKitchenElapsed } from "@/hooks/kitchen";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { KitchenTicket } from "@/types/kitchen";

type KitchenTicketCardProps = {
  ticket: KitchenTicket;
  onSelectDetails?: (ticket: KitchenTicket) => void;
  onStatusChanged?: (ticket: KitchenTicket) => void;
  compact?: boolean;
};

export function KitchenTicketCard({
  ticket,
  onSelectDetails,
  onStatusChanged,
}: KitchenTicketCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const elapsed = useKitchenElapsed(ticket.createdAt);

  const canUpdate = useHasPermission([
    "kitchen.update",
    "kitchen.manage",
    "kitchen.edit",
    "orders.changeStatus",
  ]);
  const canComplete = useHasPermission([
    "kitchen.complete",
    "kitchen.manage",
    "orders.changeStatus",
  ]);

  const isCancelled = ticket.status === "cancelled";
  const isServed = ticket.status === "served" || ticket.status === "completed";

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptKitchenOrder({ id: ticket.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Order accepted", ticket.orderNumber);
      onStatusChanged?.(result.data);
    });
  }

  function handleStartPreparing() {
    startTransition(async () => {
      const result = await startPreparingKitchenOrder({ id: ticket.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Started preparing", ticket.orderNumber);
      onStatusChanged?.(result.data);
    });
  }

  function handleMarkReady() {
    startTransition(async () => {
      const result = await markReadyKitchenOrder({ id: ticket.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Order ready", ticket.orderNumber);
      onStatusChanged?.(result.data);
    });
  }

  function handleMarkServed() {
    startTransition(async () => {
      const result = await markServedKitchenOrder({ id: ticket.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Order served", ticket.orderNumber);
      onStatusChanged?.(result.data);
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelKitchenOrder({
        id: ticket.id,
        reason: "Cancelled by kitchen staff",
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.info("Order cancelled", ticket.orderNumber);
      setShowCancelPrompt(false);
      onStatusChanged?.(result.data);
    });
  }

  const urgency = ticket.urgencyLevel ?? "normal";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border bg-card p-3.5 shadow-sm transition-all select-none",
        isCancelled && "border-destructive/60 bg-destructive/5 opacity-85",
        !isCancelled && urgency === "critical" && "border-destructive/80 bg-destructive/5 ring-1 ring-destructive/40 shadow-destructive/10",
        !isCancelled && urgency === "warning" && "border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/30",
        !isCancelled && urgency === "normal" && "border-border/80 hover:border-border"
      )}
    >
      <div>
        {/* Card Header: Order #, Table, Source, Elapsed */}
        <div className="mb-2.5 flex items-start justify-between gap-2 border-b border-border/50 pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">
                {ticket.orderNumber}
              </span>
              {/* Source badge */}
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                <QrCode className="size-2.5" />
                QR
              </span>
            </div>
            <p className="text-xs font-semibold text-primary">
              {ticket.tableLabel ? ticket.tableLabel.toUpperCase() : "TABLE -"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            {/* Live elapsed timer */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono font-bold tracking-tight",
                urgency === "critical" && "bg-destructive text-destructive-foreground animate-pulse",
                urgency === "warning" && "bg-amber-500/20 text-amber-600",
                urgency === "normal" && "bg-muted text-muted-foreground"
              )}
            >
              <Clock3 className="size-3" />
              {elapsed}
            </span>

            {urgency === "critical" && !isCancelled && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-destructive">
                <Flame className="size-3" />
                OVERDUE
              </span>
            )}
          </div>
        </div>

        {/* Customer / Notes line if present */}
        {ticket.customerLabel && (
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground truncate">
            Guest: {ticket.customerLabel}
          </p>
        )}

        {/* Items List */}
        <div className="my-2 flex flex-col gap-2">
          {ticket.items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={cn(
                "flex flex-col",
                index > 0 && "border-t border-dashed border-border/40 pt-1.5"
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-sm leading-tight text-foreground">
                  <span className="text-primary font-bold mr-1">
                    {item.quantity}x
                  </span>
                  {item.name}
                </span>
              </div>

              {/* Customizations / Add-ons / Variants */}
              {item.customizations && item.customizations.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {item.customizations.map((c, i) => (
                    <span
                      key={i}
                      className="rounded bg-accent/60 px-1 py-0.2 text-[10px] text-accent-foreground font-medium"
                    >
                      +{c.optionName}
                    </span>
                  ))}
                </div>
              )}

              {/* Item notes / special cooking instructions */}
              {item.notes && (
                <p className="mt-0.5 text-[11px] italic text-amber-600 font-medium">
                  Note: {item.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Kitchen Notes (Internal) */}
        {ticket.kitchenNotes && (
          <div className="mt-2 rounded-md bg-muted/60 p-2 text-xs border border-border/50">
            <span className="font-semibold text-muted-foreground">
              Kitchen Note:{" "}
            </span>
            <span className="text-foreground">{ticket.kitchenNotes}</span>
          </div>
        )}

        {/* Customer General Notes */}
        {ticket.notes && !ticket.kitchenNotes && (
          <div className="mt-2 rounded-md bg-muted/40 p-1.5 text-xs text-muted-foreground italic">
            &ldquo;{ticket.notes}&rdquo;
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-3.5 pt-2.5 border-t border-border/60">
        {isCancelled ? (
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-destructive/15 py-2 text-xs font-bold text-destructive">
            <XCircle className="size-4" />
            Order Cancelled
          </div>
        ) : isServed ? (
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 py-2 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="size-4" />
            Served to Table
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Primary Workflow Button according to Column */}
            {ticket.boardColumn === "new" && (
              <Button
                onClick={handleAccept}
                disabled={isPending || !canUpdate}
                className="h-11 w-full text-sm font-bold tracking-wide rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {isPending ? "Accepting…" : "ACCEPT"}
              </Button>
            )}

            {ticket.boardColumn === "accepted" && (
              <Button
                onClick={handleStartPreparing}
                disabled={isPending || !canUpdate}
                className="h-11 w-full text-sm font-bold tracking-wide rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                {isPending ? "Starting…" : "START PREPARING"}
              </Button>
            )}

            {ticket.boardColumn === "preparing" && (
              <Button
                onClick={handleMarkReady}
                disabled={isPending || !canUpdate}
                className="h-11 w-full text-sm font-bold tracking-wide rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isPending ? "Updating…" : "READY"}
              </Button>
            )}

            {ticket.boardColumn === "ready" && (
              <Button
                onClick={handleMarkServed}
                disabled={isPending || !canComplete}
                className="h-11 w-full text-sm font-bold tracking-wide rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              >
                {isPending ? "Serving…" : "SERVED"}
              </Button>
            )}

            {/* Quick Actions row: Details & Cancel */}
            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => onSelectDetails?.(ticket)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground py-1 px-1.5 rounded transition-colors"
              >
                <Eye className="size-3.5" />
                Details
              </button>

              {showCancelPrompt ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="text-xs font-bold text-destructive hover:underline py-1 px-1.5"
                  >
                    Confirm Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(false)}
                    className="text-xs text-muted-foreground hover:text-foreground py-1 px-1"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  disabled={isPending}
                  className="text-[11px] text-muted-foreground hover:text-destructive py-1 px-1.5 transition-colors"
                >
                  Cancel order
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}
