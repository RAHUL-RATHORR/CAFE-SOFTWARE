"use client";

import { motion } from "framer-motion";
import { AppCard } from "@/components/cards/app-card";
import type { TodaySummaryItem } from "@/types";

type TodaySummaryCardProps = {
  items: TodaySummaryItem[];
  title?: string;
  description?: string;
};

export function TodaySummaryCard({
  items,
  title = "Today's Summary",
  description = "Snapshot of key operating metrics",
}: TodaySummaryCardProps) {
  return (
    <AppCard title={title} description={description} className="h-full shadow-sm">
      <ul className="space-y-3">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/40 px-3 py-2.5"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-sm font-semibold text-foreground">{item.value}</span>
          </motion.li>
        ))}
      </ul>
    </AppCard>
  );
}
