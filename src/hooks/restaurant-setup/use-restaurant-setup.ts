"use client";

import { useMemo } from "react";
import {
  restaurantSetupSteps,
  RESTAURANT_SETUP_TOTAL_STEPS,
} from "@/config/restaurant-setup";
import {
  buildRestaurantSetupReviewSections,
  getSetupStepIndex,
} from "@/lib/restaurant-setup";
import { useRestaurantSetupStore } from "@/store/restaurant-setup-store";
import { toast } from "@/store/toast-store";
import type { RestaurantSetupStepStatus } from "@/types/restaurant-setup";

export function useRestaurantSetup() {
  const currentStep = useRestaurantSetupStore((s) => s.currentStep);
  const completedSteps = useRestaurantSetupStore((s) => s.completedSteps);
  const status = useRestaurantSetupStore((s) => s.status);
  const draft = useRestaurantSetupStore((s) => s.draft);
  const hasHydrated = useRestaurantSetupStore((s) => s.hasHydrated);
  const setStep = useRestaurantSetupStore((s) => s.setStep);
  const markStepCompleted = useRestaurantSetupStore((s) => s.markStepCompleted);
  const updateDraft = useRestaurantSetupStore((s) => s.updateDraft);
  const patchDraft = useRestaurantSetupStore((s) => s.patchDraft);
  const goNext = useRestaurantSetupStore((s) => s.goNext);
  const goPrevious = useRestaurantSetupStore((s) => s.goPrevious);
  const saveDraftPlaceholder = useRestaurantSetupStore(
    (s) => s.saveDraftPlaceholder
  );
  const completeSetup = useRestaurantSetupStore((s) => s.completeSetup);
  const resetSetup = useRestaurantSetupStore((s) => s.resetSetup);

  const stepIndex = getSetupStepIndex(currentStep);
  const stepDefinition =
    restaurantSetupSteps.find((s) => s.id === currentStep) ??
    restaurantSetupSteps[0];

  const progress = useMemo(() => {
    const ratio = (stepIndex + 1) / RESTAURANT_SETUP_TOTAL_STEPS;
    return Math.round(ratio * 100);
  }, [stepIndex]);

  const stepStatuses = useMemo(() => {
    return restaurantSetupSteps.map((step) => {
      let state: RestaurantSetupStepStatus = "upcoming";
      if (step.id === currentStep) state = "current";
      else if (completedSteps.includes(step.id)) state = "completed";
      return { ...step, status: state };
    });
  }, [currentStep, completedSteps]);

  const reviewSections = useMemo(
    () => buildRestaurantSetupReviewSections(draft),
    [draft]
  );

  function saveDraft() {
    saveDraftPlaceholder();
    toast.success("Draft saved", "Progress is stored on this device.");
  }

  /** Finish placeholder — no API / auth / payment. */
  function finishSetup() {
    completeSetup();
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
    totalSteps: RESTAURANT_SETUP_TOTAL_STEPS,
    setStep,
    markStepCompleted,
    updateDraft,
    patchDraft,
    goNext,
    goPrevious,
    saveDraft,
    completeSetup,
    resetSetup,
    finishSetup,
  };
}
