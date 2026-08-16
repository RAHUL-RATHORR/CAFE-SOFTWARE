"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RestaurantSetupStepDefinition,
  RestaurantSetupStepStatus,
} from "@/types/restaurant-setup";

type StepperItem = RestaurantSetupStepDefinition & {
  status: RestaurantSetupStepStatus;
};

type RestaurantSetupStepperProps = {
  steps: StepperItem[];
  onStepSelect?: (stepId: StepperItem["id"]) => void;
  className?: string;
};

export function RestaurantSetupStepper({
  steps,
  onStepSelect,
  className,
}: RestaurantSetupStepperProps) {
  return (
    <nav aria-label="Restaurant setup progress" className={cn("w-full", className)}>
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1">
        {steps.map((step, index) => {
          const isCurrent = step.status === "current";
          const isCompleted = step.status === "completed";
          const canSelect = isCompleted && !!onStepSelect;

          return (
            <li key={step.id} className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                disabled={!canSelect}
                onClick={() => onStepSelect?.(step.id)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.title}${
                  isCompleted ? ", completed" : isCurrent ? ", current" : ""
                }`}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm transition-colors",
                  isCurrent && "bg-primary/10 text-primary",
                  isCompleted && "text-foreground hover:bg-muted",
                  !isCurrent && !isCompleted && "text-muted-foreground",
                  canSelect && "cursor-pointer",
                  !canSelect && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isCurrent &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted &&
                      "border-primary/40 bg-primary/10 text-primary",
                    !isCurrent &&
                      !isCompleted &&
                      "border-border bg-background text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {isCompleted ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className="hidden font-medium lg:inline">{step.title}</span>
              </button>
              {index < steps.length - 1 ? (
                <span
                  className="hidden h-px w-4 bg-border sm:block"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
