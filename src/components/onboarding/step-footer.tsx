"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StepFooterProps = {
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  previousDisabled?: boolean;
  nextType?: "button" | "submit";
  formId?: string;
  secondaryAction?: ReactNode;
  className?: string;
  hidePrevious?: boolean;
};

export function StepFooter({
  onPrevious,
  onNext,
  previousLabel = "Previous",
  nextLabel = "Next",
  nextDisabled,
  previousDisabled,
  nextType = "button",
  formId,
  secondaryAction,
  className,
  hidePrevious,
}: StepFooterProps) {
  return (
    <footer
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {!hidePrevious ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onPrevious}
            disabled={previousDisabled}
            aria-label={previousLabel}
          >
            {previousLabel}
          </Button>
        ) : (
          <span className="hidden sm:block" aria-hidden />
        )}
        {secondaryAction}
      </div>
      <Button
        type={nextType}
        size="lg"
        form={formId}
        onClick={nextType === "button" ? onNext : undefined}
        disabled={nextDisabled}
        aria-label={nextLabel}
      >
        {nextLabel}
      </Button>
    </footer>
  );
}
