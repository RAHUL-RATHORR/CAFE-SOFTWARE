"use client";

import type { OnboardingReviewSection } from "@/types/onboarding";
import { cn } from "@/lib/utils";

type ReviewCardProps = {
  sections: OnboardingReviewSection[];
  className?: string;
};

export function ReviewCard({ sections, className }: ReviewCardProps) {
  return (
    <div className={cn("space-y-4", className)} aria-label="Onboarding summary">
      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-xl border border-border/70 bg-muted/20 p-4"
          aria-labelledby={`review-${section.id}`}
        >
          <h3
            id={`review-${section.id}`}
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
