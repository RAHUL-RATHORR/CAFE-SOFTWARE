"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AppCard } from "@/components/cards/app-card";
import { ProgressIndicator } from "@/components/onboarding/progress-indicator";
import { motionPresets } from "@/components/design-system/motion";
import { RestaurantSetupStepper } from "@/components/restaurant-setup/setup-stepper";
import { WizardLayout } from "@/components/restaurant-setup/wizard-layout";
import { FinishScreen } from "@/components/restaurant-setup/finish-screen";
import {
  RestaurantInformationSetupStep,
  LocationSetupStep,
  SubscriptionSetupStep,
  BranchSetupStep,
  TableSetupStep,
  ReviewSetupStep,
} from "@/components/restaurant-setup/steps";
import { useRestaurantSetup } from "@/hooks/restaurant-setup";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";

export function RestaurantSetupWizard() {
  const router = useRouter();
  const {
    currentStep,
    draft,
    progress,
    stepStatuses,
    reviewSections,
    hasHydrated,
    totalSteps,
    stepIndex,
    setStep,
    goPrevious,
    goNext,
    updateDraft,
    saveDraft,
    finishSetup,
    resetSetup,
  } = useRestaurantSetup();

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    panelRef.current?.focus();
  }, [currentStep, hasHydrated]);

  function handleCancel() {
    openConfirmDialog("discard", {
      title: "Cancel restaurant setup?",
      description:
        "Your local draft stays on this device unless you reset it. You can return anytime.",
      confirmLabel: "Leave wizard",
      onConfirm: async () => {
        router.push("/admin/restaurants");
      },
    });
  }

  if (!hasHydrated) {
    return (
      <AppCard
        title="Loading setup wizard"
        description="Restoring your draft…"
      >
        <div className="h-40 animate-pulse rounded-xl bg-muted/40" aria-hidden />
      </AppCard>
    );
  }

  const stepLabel = `Step ${stepIndex + 1} of ${totalSteps}`;

  return (
    <WizardLayout>
      {currentStep !== "finish" ? (
        <div className="space-y-4">
          <ProgressIndicator value={progress} label="Setup progress" />
          <RestaurantSetupStepper
            steps={stepStatuses}
            onStepSelect={(id) => {
              if (id === "finish") return;
              setStep(id);
            }}
          />
        </div>
      ) : null}

      <AppCard
        contentClassName={currentStep === "finish" ? "pt-8" : "pt-6"}
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
              {currentStep === "restaurant-information" ? (
                <RestaurantInformationSetupStep
                  stepLabel={stepLabel}
                  defaultValues={draft.restaurant}
                  onPrevious={goPrevious}
                  onSaveDraft={saveDraft}
                  onCancel={handleCancel}
                  onSubmit={(values) => {
                    updateDraft("restaurant", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "location" ? (
                <LocationSetupStep
                  stepLabel={stepLabel}
                  defaultValues={draft.location}
                  onPrevious={goPrevious}
                  onSaveDraft={saveDraft}
                  onCancel={handleCancel}
                  onSubmit={(values) => {
                    updateDraft("location", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "subscription" ? (
                <SubscriptionSetupStep
                  stepLabel={stepLabel}
                  defaultValues={draft.subscription}
                  onPrevious={goPrevious}
                  onSaveDraft={saveDraft}
                  onCancel={handleCancel}
                  onSubmit={(values) => {
                    updateDraft("subscription", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "branch-setup" ? (
                <BranchSetupStep
                  stepLabel={stepLabel}
                  defaultValues={draft.branch}
                  onPrevious={goPrevious}
                  onSaveDraft={saveDraft}
                  onCancel={handleCancel}
                  onSubmit={(values) => {
                    updateDraft("branch", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "table-setup" ? (
                <TableSetupStep
                  stepLabel={stepLabel}
                  defaultValues={draft.tables}
                  onPrevious={goPrevious}
                  onSaveDraft={saveDraft}
                  onCancel={handleCancel}
                  onSubmit={(values) => {
                    updateDraft("tables", values);
                    goNext();
                  }}
                />
              ) : null}

              {currentStep === "review" ? (
                <ReviewSetupStep
                  stepLabel={stepLabel}
                  sections={reviewSections}
                  onPrevious={goPrevious}
                  onSaveDraft={saveDraft}
                  onCancel={handleCancel}
                  onFinish={finishSetup}
                />
              ) : null}

              {currentStep === "finish" ? (
                <FinishScreen
                  restaurantName={draft.restaurant.restaurantName}
                  onRestart={resetSetup}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </AppCard>
    </WizardLayout>
  );
}
