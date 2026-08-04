"use client";

import { Clock3, Flame, CheckCircle2, ChefHat, Timer } from "lucide-react";
import { StatCard } from "@/components/cards/stat-card";
import type { KitchenSummary } from "@/types/kitchen";

type KitchenSummaryCardsProps = {
  summary: KitchenSummary;
};

export function KitchenSummaryCards({ summary }: KitchenSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Orders waiting"
        value={String(summary.waiting)}
        description="Pending / confirmed"
        accent="warning"
        icon={<Clock3 className="size-4" />}
      />
      <StatCard
        title="Preparing"
        value={String(summary.preparing)}
        description="In the kitchen"
        accent="primary"
        icon={<Flame className="size-4" />}
      />
      <StatCard
        title="Ready"
        value={String(summary.ready)}
        description="Awaiting service"
        accent="success"
        icon={<ChefHat className="size-4" />}
      />
      <StatCard
        title="Completed today"
        value={String(summary.completedToday)}
        description="Served or completed"
        accent="success"
        icon={<CheckCircle2 className="size-4" />}
      />
      <StatCard
        title="Avg prep time"
        value={
          summary.averagePreparationMinutes != null
            ? `${summary.averagePreparationMinutes}m`
            : "—"
        }
        description="Placeholder metric"
        accent="primary"
        icon={<Timer className="size-4" />}
      />
    </div>
  );
}
