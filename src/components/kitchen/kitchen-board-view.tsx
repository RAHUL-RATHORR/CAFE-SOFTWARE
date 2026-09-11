"use client";

import { AnimatePresence, motion } from "framer-motion";
import { KitchenTicketCard } from "@/components/kitchen/kitchen-ticket-card";
import { KITCHEN_BOARD_COLUMNS } from "@/types/kitchen";
import type { KitchenBoard, KitchenTicket } from "@/types/kitchen";
import { cn } from "@/lib/utils";

type KitchenBoardViewProps = {
  board: KitchenBoard;
  onSelectDetails?: (ticket: KitchenTicket) => void;
  onStatusChanged?: (ticket: KitchenTicket) => void;
  compact?: boolean;
};

const COLUMN_META: Record<
  (typeof KITCHEN_BOARD_COLUMNS)[number],
  {
    title: string;
    subtitle: string;
    badgeBg: string;
    headerBorder: string;
  }
> = {
  new: {
    title: "NEW",
    subtitle: "Awaiting Accept",
    badgeBg: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    headerBorder: "border-l-emerald-500",
  },
  accepted: {
    title: "ACCEPTED",
    subtitle: "Queued for Prep",
    badgeBg: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    headerBorder: "border-l-amber-500",
  },
  preparing: {
    title: "PREPARING",
    subtitle: "Cooking in Kitchen",
    badgeBg: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    headerBorder: "border-l-blue-500",
  },
  ready: {
    title: "READY",
    subtitle: "Ready to Serve",
    badgeBg: "bg-violet-500/15 text-violet-600 border-violet-500/30",
    headerBorder: "border-l-violet-500",
  },
};

export function KitchenBoardView({
  board,
  onSelectDetails,
  onStatusChanged,
  compact = false,
}: KitchenBoardViewProps) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4 min-h-[calc(100vh-14rem)]">
      {KITCHEN_BOARD_COLUMNS.map((column, columnIndex) => {
        const meta = COLUMN_META[column];
        const tickets = board[column] ?? [];

        return (
          <motion.section
            key={column}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: columnIndex * 0.04, duration: 0.2 }}
            data-kitchen-column={column}
            className={cn(
              "flex flex-col rounded-xl border border-border/70 bg-muted/20 p-2.5 sm:p-3 overflow-hidden",
              "border-l-4",
              meta.headerBorder
            )}
          >
            {/* Column Header */}
            <header className="mb-3 flex items-center justify-between gap-2 border-b border-border/50 pb-2 px-1">
              <div>
                <h2 className="text-sm font-bold tracking-wider text-foreground">
                  {meta.title}
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  {meta.subtitle}
                </p>
              </div>

              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-mono font-bold",
                  meta.badgeBg
                )}
              >
                {tickets.length}
              </span>
            </header>

            {/* Column Tickets Container */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {tickets.length === 0 ? (
                  <motion.div
                    key={`${column}-empty`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 py-12 text-center text-xs text-muted-foreground"
                  >
                    No orders in this column
                  </motion.div>
                ) : (
                  tickets.map((ticket) => (
                    <KitchenTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onSelectDetails={onSelectDetails}
                      onStatusChanged={onStatusChanged}
                      compact={compact}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
