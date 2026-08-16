"use client";

import { Check } from "lucide-react";
import { Form } from "@/components/forms/form";
import { StepHeader } from "@/components/onboarding/step-header";
import { WizardFooter } from "@/components/restaurant-setup/wizard-layout";
import { SlideIn } from "@/components/design-system/motion";
import { setupSubscriptionPlans } from "@/config/restaurant-setup";
import {
  subscriptionSetupSchema,
  type SubscriptionSetupValues,
} from "@/lib/restaurant-setup";
import { cn } from "@/lib/utils";
import type { SetupSubscriptionPlanId } from "@/types/restaurant-setup";

type SubscriptionSetupStepProps = {
  stepLabel: string;
  defaultValues: SubscriptionSetupValues;
  onPrevious: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  onSubmit: (values: SubscriptionSetupValues) => void;
};

export function SubscriptionSetupStep({
  stepLabel,
  defaultValues,
  onPrevious,
  onSaveDraft,
  onCancel,
  onSubmit,
}: SubscriptionSetupStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel={stepLabel}
        title="Subscription"
        description="Select a plan for this restaurant. Payment gateway is not connected yet."
      />
      <Form
        schema={subscriptionSetupSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        className="space-y-6"
      >
        {(form) => {
          const selected = form.watch("planId");
          return (
            <>
              <div
                role="radiogroup"
                aria-label="Subscription plan"
                className="grid gap-3 md:grid-cols-2"
              >
                {setupSubscriptionPlans.map((plan) => {
                  const isSelected = selected === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() =>
                        form.setValue("planId", plan.id as SetupSubscriptionPlanId, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className={cn(
                        "rounded-xl border p-4 text-left transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/70 hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">{plan.name}</h3>
                            {plan.recommended ? (
                              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-primary uppercase">
                                Recommended
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {plan.description}
                          </p>
                        </div>
                        {isSelected ? (
                          <Check className="size-4 shrink-0 text-primary" aria-hidden />
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-medium">{plan.priceLabel}</p>
                      <ul className="mt-3 space-y-1.5">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-xs text-muted-foreground"
                          >
                            <Check
                              className="mt-0.5 size-3.5 shrink-0 text-primary"
                              aria-hidden
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <WizardFooter
                nextType="submit"
                nextLabel="Next"
                onBack={onPrevious}
                onSaveDraft={onSaveDraft}
                onCancel={onCancel}
              />
            </>
          );
        }}
      </Form>
    </SlideIn>
  );
}
