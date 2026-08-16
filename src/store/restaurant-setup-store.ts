"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RESTAURANT_SETUP_STORAGE_KEY } from "@/config/restaurant-setup";
import {
  defaultRestaurantSetupDraft,
  getNextSetupStepId,
  getPreviousSetupStepId,
} from "@/lib/restaurant-setup";
import type {
  RestaurantSetupDraft,
  RestaurantSetupFlowStatus,
  RestaurantSetupStepId,
} from "@/types/restaurant-setup";

type RestaurantSetupState = {
  currentStep: RestaurantSetupStepId;
  completedSteps: RestaurantSetupStepId[];
  status: RestaurantSetupFlowStatus;
  draft: RestaurantSetupDraft;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setStep: (step: RestaurantSetupStepId) => void;
  markStepCompleted: (step: RestaurantSetupStepId) => void;
  updateDraft: <K extends keyof RestaurantSetupDraft>(
    section: K,
    values: RestaurantSetupDraft[K]
  ) => void;
  patchDraft: (partial: Partial<RestaurantSetupDraft>) => void;
  goNext: () => void;
  goPrevious: () => void;
  /** Save Draft placeholder — draft already persists via Zustand */
  saveDraftPlaceholder: () => void;
  completeSetup: () => void;
  resetSetup: () => void;
};

function uniqueSteps(steps: RestaurantSetupStepId[]): RestaurantSetupStepId[] {
  return Array.from(new Set(steps));
}

export const useRestaurantSetupStore = create<RestaurantSetupState>()(
  persist(
    (set, get) => ({
      currentStep: "restaurant-information",
      completedSteps: [],
      status: "idle",
      draft: defaultRestaurantSetupDraft(),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setStep: (step) =>
        set({
          currentStep: step,
          status:
            step === "finish"
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
          status: "in-progress",
        }),
      patchDraft: (partial) =>
        set({
          draft: {
            ...get().draft,
            ...partial,
          },
          status: "in-progress",
        }),
      goNext: () => {
        const next = getNextSetupStepId(get().currentStep);
        if (!next) return;
        const current = get().currentStep;
        set({
          completedSteps: uniqueSteps([...get().completedSteps, current]),
          currentStep: next,
          status:
            next === "finish"
              ? "completed"
              : next === "review"
                ? "review"
                : "in-progress",
        });
      },
      goPrevious: () => {
        const prev = getPreviousSetupStepId(get().currentStep);
        if (!prev) return;
        set({
          currentStep: prev,
          status: "in-progress",
        });
      },
      saveDraftPlaceholder: () => {
        // Persistence is handled by zustand/persist; this is an intentional UI noop hook.
        set({ status: get().status === "idle" ? "in-progress" : get().status });
      },
      completeSetup: () =>
        set({
          currentStep: "finish",
          status: "completed",
          completedSteps: uniqueSteps([
            ...get().completedSteps,
            "restaurant-information",
            "location",
            "subscription",
            "branch-setup",
            "table-setup",
            "review",
          ]),
        }),
      resetSetup: () =>
        set({
          currentStep: "restaurant-information",
          completedSteps: [],
          status: "idle",
          draft: defaultRestaurantSetupDraft(),
        }),
    }),
    {
      name: RESTAURANT_SETUP_STORAGE_KEY,
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
