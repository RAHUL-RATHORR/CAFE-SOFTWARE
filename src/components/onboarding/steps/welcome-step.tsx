"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { StepHeader } from "@/components/onboarding/step-header";
import { StepFooter } from "@/components/onboarding/step-footer";
import { SlideIn } from "@/components/design-system/motion";

type WelcomeStepProps = {
  onStart: () => void;
};

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <SlideIn>
      <StepHeader
        stepLabel="Step 1 of 8"
        title="Welcome to DineFlow"
        description="Set up your restaurant workspace with a guided onboarding flow. Everything stays on this device until restaurant creation is wired."
      />
      <div className="mb-8 rounded-xl border border-dashed border-border/80 bg-muted/20 p-6">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-base font-semibold outline-none"
        >
          What you will configure
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Restaurant identity and contact details</li>
          <li>Business and location information</li>
          <li>Currency, timezone, and brand preferences</li>
        </ul>
      </div>
      <StepFooter
        hidePrevious
        nextLabel="Get started"
        onNext={onStart}
      />
    </SlideIn>
  );
}
