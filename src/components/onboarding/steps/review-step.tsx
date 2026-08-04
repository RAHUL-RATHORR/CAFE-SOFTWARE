"use client";

import { StepHeader } from "@/components/onboarding/step-header";
import { StepFooter } from "@/components/onboarding/step-footer";
import { ReviewCard } from "@/components/onboarding/review-card";
import { SlideIn } from "@/components/design-system/motion";
import type { OnboardingReviewSection } from "@/types/onboarding";

type ReviewStepProps = {
  sections: OnboardingReviewSection[];
  onPrevious: () => void;
  onFinish: () => void;
};

export function ReviewStep({
  sections,
  onPrevious,
  onFinish,
}: ReviewStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel="Step 7 of 8"
        title="Review"
        description="Confirm your onboarding summary. Finish stores a local tenant draft only."
      />
      <ReviewCard sections={sections} className="mb-8" />
      <StepFooter
        previousLabel="Previous"
        nextLabel="Finish"
        onPrevious={onPrevious}
        onNext={onFinish}
      />
    </SlideIn>
  );
}
