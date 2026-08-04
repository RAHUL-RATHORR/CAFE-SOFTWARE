"use client";

import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import type { PopularMenuItem } from "@/types";

type PopularMenuCardProps = {
  items: PopularMenuItem[];
  title?: string;
  description?: string;
};

export function PopularMenuCard({
  items,
  title = "Popular Menu",
  description = "Top items placeholder — no live menu data",
}: PopularMenuCardProps) {
  return (
    <AppCard title={title} description={description} className="h-full shadow-sm">
      <ul className="space-y-3">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="flex items-center gap-3 rounded-xl border border-border/80 p-3"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <UtensilsCrossed className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.category} · {item.orders} orders
              </p>
            </div>
            <span className="text-sm font-semibold">{item.price}</span>
          </motion.li>
        ))}
      </ul>
    </AppCard>
  );
}
