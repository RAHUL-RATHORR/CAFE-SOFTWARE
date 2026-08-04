"use client";

import { AppCard } from "@/components/cards/app-card";

export function ShiftCalendarPlaceholder() {
  return (
    <AppCard
      title="Shift calendar"
      description="Visual calendar view will appear here in a future update"
    >
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground sm:gap-2 sm:text-sm">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="rounded-xl border border-dashed border-border/70 py-6 sm:py-8"
          >
            {day}
          </div>
        ))}
      </div>
    </AppCard>
  );
}
