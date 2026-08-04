"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SalesPeriod } from "@/types";

type SalesOverviewCardProps = {
  title?: string;
  periods: { value: SalesPeriod; label: string }[];
  barsByPeriod: Record<SalesPeriod, number[]>;
  defaultPeriod?: SalesPeriod;
};

export function SalesOverviewCard({
  title = "Sales Overview",
  periods,
  barsByPeriod,
  defaultPeriod = "week",
}: SalesOverviewCardProps) {
  const [period, setPeriod] = useState<SalesPeriod>(defaultPeriod);
  const bars = barsByPeriod[period];

  return (
    <AppCard
      title={title}
      description="Performance placeholder — chart library can plug in later"
      className="h-full shadow-sm"
      contentClassName="space-y-4 pt-4"
    >
      <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
        {periods.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={period === option.value ? "default" : "ghost"}
            className={cn(
              "h-7 flex-1 rounded-lg px-2.5 text-xs sm:flex-none",
              period !== option.value && "text-muted-foreground"
            )}
            onClick={() => setPeriod(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex h-64 flex-col justify-end gap-4">
        <div className="flex h-48 items-end gap-1.5 sm:gap-2.5">
          {bars.map((height, index) => (
            <motion.div
              key={`${period}-${index}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${height}%`, opacity: 1 }}
              transition={{ duration: 0.45, delay: index * 0.03, ease: "easeOut" }}
              className="flex-1 rounded-t-lg bg-primary/80"
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BarChart3 className="size-3.5" aria-hidden />
          Premium chart placeholder for {period} view
        </div>
      </div>
    </AppCard>
  );
}
