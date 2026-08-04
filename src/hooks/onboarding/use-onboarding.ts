"use client";

import { useMemo } from "react";
import { onboardingSteps, ONBOARDING_TOTAL_STEPS } from "@/config/onboarding";
import {
  buildOnboardingReviewSections,
  draftToTenantPlaceholder,
  getStepIndex,
} from "@/lib/onboarding";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useTenantStore } from "@/store/tenant-store";
import type { OnboardingStepStatus } from "@/types/onboarding";

export function useOnboarding() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const completedSteps = useOnboardingStore((s) => s.completedSteps);
  const status = useOnboardingStore((s) => s.status);
  const draft = useOnboardingStore((s) => s.draft);
  const hasHydrated = useOnboardingStore((s) => s.hasHydrated);
  const setStep = useOnboardingStore((s) => s.setStep);
  const markStepCompleted = useOnboardingStore((s) => s.markStepCompleted);
  const updateDraft = useOnboardingStore((s) => s.updateDraft);
  const patchDraft = useOnboardingStore((s) => s.patchDraft);
  const goNext = useOnboardingStore((s) => s.goNext);
  const goPrevious = useOnboardingStore((s) => s.goPrevious);
  const startOnboarding = useOnboardingStore((s) => s.startOnboarding);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);
  const applyOnboardingTenant = useTenantStore((s) => s.applyOnboardingTenant);

  const stepIndex = getStepIndex(currentStep);
  const stepDefinition =
    onboardingSteps.find((s) => s.id === currentStep) ?? onboardingSteps[0];

  const progress = useMemo(() => {
    const ratio = (stepIndex + 1) / ONBOARDING_TOTAL_STEPS;
    return Math.round(ratio * 100);
  }, [stepIndex]);

  const stepStatuses = useMemo(() => {
    return onboardingSteps.map((step) => {
      let state: OnboardingStepStatus = "upcoming";
      if (step.id === currentStep) state = "current";
      else if (completedSteps.includes(step.id)) state = "completed";
      return { ...step, status: state };
    });
  }, [currentStep, completedSteps]);

  const reviewSections = useMemo(
    () => buildOnboardingReviewSections(draft),
    [draft]
  );

  /** Finish placeholder — applies tenant draft locally, no API. */
  function finishPlaceholder() {
    const tenant = draftToTenantPlaceholder(draft);
    applyOnboardingTenant(tenant);
    completeOnboarding();
  }

  return {
    currentStep,
    completedSteps,
    status,
    draft,
    hasHydrated,
    stepIndex,
    stepDefinition,
    progress,
    stepStatuses,
    reviewSections,
    totalSteps: ONBOARDING_TOTAL_STEPS,
    setStep,
    markStepCompleted,
    updateDraft,
    patchDraft,
    goNext,
    goPrevious,
    startOnboarding,
    completeOnboarding,
    resetOnboarding,
    finishPlaceholder,
  };
}
