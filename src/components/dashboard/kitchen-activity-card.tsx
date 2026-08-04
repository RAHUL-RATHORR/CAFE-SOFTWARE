"use client";

import { motion } from "framer-motion";
import { AppCard } from "@/components/cards/app-card";
import { cn } from "@/lib/utils";
import type { KitchenActivityItem } from "@/types";

type KitchenActivityCardProps = {
  items: KitchenActivityItem[];
  title?: string;
  description?: string;
};

const toneStyles = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  muted: "bg-muted-foreground",
} as const;

export function KitchenActivityCard({
  items,
  title = "Kitchen Activity",
  description = "Live floor timeline placeholder",
}: KitchenActivityCardProps) {
  return (
    <AppCard title={title} description={description} className="h-full shadow-sm">
      <ol className="relative space-y-4 border-l border-border pl-4">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="relative"
          >
            <span
              className={cn(
                "absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-4 ring-card",
                toneStyles[item.tone]
              )}
              aria-hidden
            />
            <div className="rounded-xl border border-border/80 bg-background px-3 py-2.5">
              <p className="text-sm font-medium text-foreground">
                Order {item.orderNumber}{" "}
                <span className="font-normal text-muted-foreground">
                  {item.statusLabel}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </AppCard>
  );
}
