"use client";

import { StepHeader } from "@/components/onboarding/step-header";
import { SetupSummary } from "@/components/restaurant-setup/setup-summary";
import { WizardFooter } from "@/components/restaurant-setup/wizard-layout";
import { SlideIn } from "@/components/design-system/motion";
import type { RestaurantSetupReviewSection } from "@/types/restaurant-setup";

type ReviewSetupStepProps = {
  stepLabel: string;
  sections: RestaurantSetupReviewSection[];
  onPrevious: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  onFinish: () => void;
};

export function ReviewSetupStep({
  stepLabel,
  sections,
  onPrevious,
  onSaveDraft,
  onCancel,
  onFinish,
}: ReviewSetupStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel={stepLabel}
        title="Review"
        description="Confirm restaurant, owner, branch, plan, and tables before finishing."
      />
      <div className="space-y-6">
        <SetupSummary sections={sections} />
        <WizardFooter
          nextLabel="Finish"
          onBack={onPrevious}
          onNext={onFinish}
          onSaveDraft={onSaveDraft}
          onCancel={onCancel}
        />
      </div>
    </SlideIn>
  );
}
