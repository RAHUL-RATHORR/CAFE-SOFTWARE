"use client";

import { AnimatePresence, motion } from "framer-motion";
import { KitchenTicketCard } from "@/components/kitchen/kitchen-ticket-card";
import { KITCHEN_BOARD_COLUMN_LABELS } from "@/config/kitchen";
import { KITCHEN_BOARD_COLUMNS } from "@/types/kitchen";
import type { KitchenBoard } from "@/types/kitchen";
import { cn } from "@/lib/utils";

type KitchenBoardViewProps = {
  board: KitchenBoard;
};

/**
 * Kanban-style kitchen board.
 * Drag-ready architecture: columns are drop targets; DnD wiring is optional later.
 */
export function KitchenBoardView({ board }: KitchenBoardViewProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {KITCHEN_BOARD_COLUMNS.map((column, columnIndex) => (
        <motion.section
          key={column}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: columnIndex * 0.05, duration: 0.25 }}
          data-kitchen-column={column}
          data-droppable="true"
          className={cn(
            "flex min-h-[280px] flex-col rounded-xl border border-border/70 bg-muted/20 p-3",
            "transition-colors"
          )}
        >
          <header className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              {KITCHEN_BOARD_COLUMN_LABELS[column]}
            </h3>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {board[column].length}
            </span>
          </header>
          <div className="flex flex-1 flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {board[column].length === 0 ? (
                <motion.p
                  key={`${column}-empty`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground"
                >
                  No tickets
                </motion.p>
              ) : (
                board[column].map((ticket) => (
                  <KitchenTicketCard key={ticket.id} ticket={ticket} />
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      ))}
    </div>
  );
}
