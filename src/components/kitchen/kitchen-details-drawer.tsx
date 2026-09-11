"use client";

import {
  Clock3,
  QrCode,
  User,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
} from "@/config/orders";
import type { KitchenTicket } from "@/types/kitchen";
import { useKitchenElapsed } from "@/hooks/kitchen";

type KitchenDetailsDrawerProps = {
  ticket: KitchenTicket | null;
  onClose: () => void;
};

export function KitchenDetailsDrawer({
  ticket,
  onClose,
}: KitchenDetailsDrawerProps) {
  const elapsed = useKitchenElapsed(ticket?.createdAt ?? new Date().toISOString());

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {ticket.orderNumber}
              </h2>
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground uppercase">
                <QrCode className="size-3" />
                QR Order
              </span>
            </div>
            <p className="text-sm font-semibold text-primary mt-0.5">
              {ticket.tableLabel ? ticket.tableLabel.toUpperCase() : "TABLE -"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Status & Timing summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 p-3 border border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <DsBadge variant={ORDER_STATUS_VARIANTS[ticket.status]} size="sm">
                {ORDER_STATUS_LABELS[ticket.status]}
              </DsBadge>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground">
              <Clock3 className="size-3.5" />
              Waiting: {elapsed}
            </div>
          </div>

          {/* Customer info */}
          {ticket.customerLabel && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <User className="size-4 text-muted-foreground" />
              <span>Customer: <strong className="font-semibold">{ticket.customerLabel}</strong></span>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Ordered Items ({ticket.items.length})
            </h3>
            <div className="divide-y rounded-xl border border-border/60 bg-muted/20">
              {ticket.items.map((item, idx) => (
                <div key={idx} className="p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      <span className="text-primary font-bold mr-1.5">
                        {item.quantity}x
                      </span>
                      {item.name}
                    </span>
                  </div>

                  {item.customizations && item.customizations.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.customizations.map((c, ci) => (
                        <span
                          key={ci}
                          className="rounded bg-accent/70 px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground"
                        >
                          +{c.optionName}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.notes && (
                    <p className="mt-1 text-xs italic text-amber-600">
                      Cooking Note: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kitchen / Special notes */}
          {(ticket.kitchenNotes || ticket.notes) && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
              {ticket.kitchenNotes && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground">
                    Kitchen Internal Notes
                  </h4>
                  <p className="text-xs text-foreground mt-0.5">
                    {ticket.kitchenNotes}
                  </p>
                </div>
              )}
              {ticket.notes && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground">
                    Customer Notes
                  </h4>
                  <p className="text-xs text-foreground mt-0.5">
                    {ticket.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status History Timeline */}
          {ticket.statusHistory && ticket.statusHistory.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Lifecycle Timeline
              </h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {ticket.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-primary shrink-0" />
                    <span className="font-semibold text-foreground uppercase">
                      {h.status}
                    </span>
                    <span className="text-[11px]">
                      {new Date(h.changedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    {h.note && <span className="text-muted-foreground/80 italic">— {h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 pt-3 flex justify-end">
          <Button onClick={onClose} variant="outline" className="rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
