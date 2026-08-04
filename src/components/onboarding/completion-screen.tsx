"use client";

import Link from "next/link";
import { CheckCircle2, LayoutDashboard, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SlideIn } from "@/components/design-system/motion";
import { DASHBOARD_HREF } from "@/config/routes";
import { cn } from "@/lib/utils";

type CompletionScreenProps = {
  restaurantName?: string;
  onRestart?: () => void;
  className?: string;
};

export function CompletionScreen({
  restaurantName,
  onRestart,
  className,
}: CompletionScreenProps) {
  return (
    <SlideIn className={cn("text-center", className)}>
      <div
        className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        aria-hidden
      >
        <CheckCircle2 className="size-7" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">
        Onboarding draft complete
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {restaurantName
          ? `${restaurantName} is ready as a local tenant draft.`
          : "Your restaurant draft is ready."}{" "}
        No data was submitted — creation APIs arrive in a later module.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={DASHBOARD_HREF}
          className={cn(buttonVariants({ size: "lg" }))}
        >
          <LayoutDashboard data-icon="inline-start" />
          Go to dashboard
        </Link>
        {onRestart ? (
          <Button type="button" variant="outline" size="lg" onClick={onRestart}>
            <RotateCcw data-icon="inline-start" />
            Start over
          </Button>
        ) : null}
      </div>
    </SlideIn>
  );
}
