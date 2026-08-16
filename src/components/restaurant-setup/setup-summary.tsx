"use client";

import type { RestaurantSetupReviewSection } from "@/types/restaurant-setup";
import { cn } from "@/lib/utils";

type SetupSummaryProps = {
  sections: RestaurantSetupReviewSection[];
  className?: string;
};

export function SetupSummary({ sections, className }: SetupSummaryProps) {
  return (
    <div
      className={cn("space-y-4", className)}
      aria-label="Restaurant setup summary"
    >
      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-xl border border-border/70 bg-muted/20 p-4"
          aria-labelledby={`setup-review-${section.id}`}
        >
          <h3
            id={`setup-review-${section.id}`}
            className="mb-3 text-sm font-semibold tracking-tight"
          >
            {section.title}
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={`${section.id}-${field.label}`} className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="text-sm font-medium break-words">{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
