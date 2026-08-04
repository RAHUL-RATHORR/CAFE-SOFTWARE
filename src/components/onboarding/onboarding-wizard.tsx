"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import { ProgressIndicator } from "@/components/onboarding/progress-indicator";
import { CompletionScreen } from "@/components/onboarding/completion-screen";
import {
  WelcomeStep,
  RestaurantInformationStep,
  BusinessDetailsStep,
  AddressStep,
  CurrencyTimezoneStep,
  BrandingStep,
  ReviewStep,
} from "@/components/onboarding/steps";
import { useOnboarding } from "@/hooks/onboarding";
import { motionPresets } from "@/components/design-system/motion";

export function OnboardingWizard() {
  const {
    currentStep,
    draft,
    progress,
    stepStatuses,
    reviewSections,
    hasHydrated,
    setStep,
    startOnboarding,
    goPrevious,
    goNext,
    updateDraft,
    finishPlaceholder,
    resetOnboarding,
  } = useOnboarding();

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    panelRef.current?.focus();
  }, [currentStep, hasHydrated]);

  if (!hasHydrated) {
    return (
      <OnboardingCard
        title="Loading onboarding"
        description="Restoring your draft…"
      >
        <div className="h-40 animate-pulse rounded-xl bg-muted/40" aria-hidden />
      </OnboardingCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <ProgressIndicator value={progress} />
        <OnboardingStepper
          steps={stepStatuses}
          onStepSelect={(id) => {
            if (id === "completion") return;
            setStep(id);
          }}
        />
      </div>

      <OnboardingCard
        contentClassName={
          currentStep === "welcome" || currentStep === "completion"
            ? "pt-8"
            : "pt-6"
        }
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          className="outline-none"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={motionPresets.slideUp.initial}
              animate={motionPresets.slideUp.animate}
              exit={motionPresets.slideUp.exit}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {currentStep === "welcome" ? (
                <WelcomeStep onStart={startOnboarding} />
              ) : null}

              {currentStep === "restaurant-information" ? (
                <RestaurantInformationStep
                  defaultValues={draft.restaurant}
                  onPrevious={goPrevious}
                  onSubmit={(values) => {
                    updateDraft("restaurant", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "business-details" ? (
                <BusinessDetailsStep
                  defaultValues={draft.business}
                  onPrevious={goPrevious}
                  onSubmit={(values) => {
                    updateDraft("business", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "address" ? (
                <AddressStep
                  defaultValues={draft.address}
                  onPrevious={goPrevious}
                  onSubmit={(values) => {
                    updateDraft("address", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "currency-timezone" ? (
                <CurrencyTimezoneStep
                  defaultValues={draft.regional}
                  onPrevious={goPrevious}
                  onSubmit={(values) => {
                    updateDraft("regional", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "branding" ? (
                <BrandingStep
                  defaultValues={draft.branding}
                  onPrevious={goPrevious}
                  onSubmit={(values) => {
                    updateDraft("branding", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "review" ? (
                <ReviewStep
                  sections={reviewSections}
                  onPrevious={goPrevious}
                  onFinish={finishPlaceholder}
                />
              ) : null}

              {currentStep === "completion" ? (
                <CompletionScreen
                  restaurantName={draft.restaurant.name}
                  onRestart={resetOnboarding}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </OnboardingCard>
    </div>
  );
}
