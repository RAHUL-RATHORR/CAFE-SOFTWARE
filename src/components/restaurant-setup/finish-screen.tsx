"use client";

import Link from "next/link";
import { CheckCircle2, RotateCcw, Store } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SlideIn } from "@/components/design-system/motion";
import { restaurantSetupNextSteps } from "@/config/restaurant-setup";
import { cn } from "@/lib/utils";

type FinishScreenProps = {
  restaurantName?: string;
  onRestart?: () => void;
  className?: string;
};

export function FinishScreen({
  restaurantName,
  onRestart,
  className,
}: FinishScreenProps) {
  return (
    <SlideIn className={cn("text-center", className)}>
      <div
        className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        aria-hidden
      >
        <CheckCircle2 className="size-7" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">
        Restaurant setup is complete.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {restaurantName
          ? `${restaurantName} is ready as a local onboarding draft.`
          : "The restaurant onboarding draft is ready."}{" "}
        Login credentials, QR codes, and persistence APIs arrive in later
        modules.
      </p>

      <ul className="mx-auto mt-8 max-w-sm space-y-2 text-left">
        {restaurantSetupNextSteps.map((step) => (
          <li
            key={step.id}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm"
          >
            <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
            <span>{step.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/admin/restaurants"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          <Store data-icon="inline-start" />
          Back to restaurants
        </Link>
        {onRestart ? (
          <Button type="button" variant="outline" size="lg" onClick={onRestart}>
            <RotateCcw data-icon="inline-start" />
            Onboard another
          </Button>
        ) : null}
      </div>
    </SlideIn>
  );
}
