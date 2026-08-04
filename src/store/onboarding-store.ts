"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ONBOARDING_STORAGE_KEY } from "@/config/onboarding";
import {
  defaultOnboardingDraft,
  getNextStepId,
  getPreviousStepId,
} from "@/lib/onboarding";
import type {
  OnboardingDraft,
  OnboardingFlowStatus,
  OnboardingStepId,
} from "@/types/onboarding";

type OnboardingState = {
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  status: OnboardingFlowStatus;
  draft: OnboardingDraft;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setStep: (step: OnboardingStepId) => void;
  markStepCompleted: (step: OnboardingStepId) => void;
  updateDraft: <K extends keyof OnboardingDraft>(
    section: K,
    values: OnboardingDraft[K]
  ) => void;
  patchDraft: (partial: Partial<OnboardingDraft>) => void;
  goNext: () => void;
  goPrevious: () => void;
  startOnboarding: () => void;
  /** Finish placeholder — no submission / API */
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

function uniqueSteps(steps: OnboardingStepId[]): OnboardingStepId[] {
  return Array.from(new Set(steps));
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: "welcome",
      completedSteps: [],
      status: "idle",
      draft: defaultOnboardingDraft(),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setStep: (step) =>
        set({
          currentStep: step,
          status:
            step === "completion"
              ? "completed"
              : step === "review"
                ? "review"
                : "in-progress",
        }),
      markStepCompleted: (step) =>
        set({
          completedSteps: uniqueSteps([...get().completedSteps, step]),
        }),
      updateDraft: (section, values) =>
        set({
          draft: {
            ...get().draft,
            [section]: values,
          },
        }),
      patchDraft: (partial) =>
        set({
          draft: {
            ...get().draft,
            ...partial,
          },
        }),
      goNext: () => {
        const next = getNextStepId(get().currentStep);
        if (!next) return;
        const current = get().currentStep;
        set({
          completedSteps: uniqueSteps([...get().completedSteps, current]),
          currentStep: next,
          status:
            next === "completion"
              ? "completed"
              : next === "review"
                ? "review"
                : "in-progress",
        });
      },
      goPrevious: () => {
        const prev = getPreviousStepId(get().currentStep);
        if (!prev) return;
        set({
          currentStep: prev,
          status: prev === "welcome" ? "idle" : "in-progress",
        });
      },
      startOnboarding: () =>
        set({
          currentStep: "restaurant-information",
          status: "in-progress",
          completedSteps: uniqueSteps([...get().completedSteps, "welcome"]),
        }),
      completeOnboarding: () =>
        set({
          currentStep: "completion",
          status: "completed",
          completedSteps: uniqueSteps([
            ...get().completedSteps,
            "welcome",
            "restaurant-information",
            "business-details",
            "address",
            "currency-timezone",
            "branding",
            "review",
          ]),
        }),
      resetOnboarding: () =>
        set({
          currentStep: "welcome",
          completedSteps: [],
          status: "idle",
          draft: defaultOnboardingDraft(),
        }),
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        status: state.status,
        draft: state.draft,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
