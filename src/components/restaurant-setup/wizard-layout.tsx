"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WizardFooterProps = {
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextType?: "button" | "submit";
  nextDisabled?: boolean;
  hideBack?: boolean;
  className?: string;
};

export function WizardFooter({
  onBack,
  onNext,
  onSaveDraft,
  onCancel,
  backLabel = "Back",
  nextLabel = "Next",
  nextType = "button",
  nextDisabled,
  hideBack,
  className,
}: WizardFooterProps) {
  return (
    <footer
      className={cn(
        "flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {!hideBack ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            aria-label={backLabel}
          >
            {backLabel}
          </Button>
        ) : null}
        {onSaveDraft ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onSaveDraft}
          >
            Save Draft
          </Button>
        ) : null}
        {onCancel ? (
          <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
      <Button
        type={nextType}
        size="lg"
        onClick={nextType === "button" ? onNext : undefined}
        disabled={nextDisabled}
        aria-label={nextLabel}
      >
        {nextLabel}
      </Button>
    </footer>
  );
}

type WizardLayoutProps = {
  children: ReactNode;
  className?: string;
};

export function WizardLayout({ children, className }: WizardLayoutProps) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}
