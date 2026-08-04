"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BaseButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  children?: ReactNode;
  className?: string;
};

function ActionButton({
  isLoading,
  children,
  className,
  disabled,
  variant = "default",
  ...props
}: BaseButtonProps & { variant?: "default" | "outline" | "ghost" | "destructive" }) {
  return (
    <Button
      type={props.type ?? "button"}
      variant={variant}
      disabled={disabled || isLoading}
      className={cn("rounded-xl gap-2", className)}
      {...props}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}

export function SaveButton({ children = "Save", ...props }: BaseButtonProps) {
  return (
    <ActionButton type="submit" {...props}>
      {!props.isLoading ? <Save className="size-4" aria-hidden /> : null}
      {children}
    </ActionButton>
  );
}

export function SubmitButton({ children = "Submit", ...props }: BaseButtonProps) {
  return (
    <ActionButton type="submit" {...props}>
      {!props.isLoading ? <Check className="size-4" aria-hidden /> : null}
      {children}
    </ActionButton>
  );
}

export function CancelButton({ children = "Cancel", ...props }: BaseButtonProps) {
  return (
    <ActionButton variant="outline" {...props}>
      <X className="size-4" aria-hidden />
      {children}
    </ActionButton>
  );
}

export function ResetButton({ children = "Reset", ...props }: BaseButtonProps) {
  return (
    <ActionButton type="reset" variant="ghost" {...props}>
      <RotateCcw className="size-4" aria-hidden />
      {children}
    </ActionButton>
  );
}

export function BackButton({ children = "Back", ...props }: BaseButtonProps) {
  return (
    <ActionButton variant="outline" {...props}>
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </ActionButton>
  );
}

export function NextButton({ children = "Next", ...props }: BaseButtonProps) {
  return (
    <ActionButton {...props}>
      {children}
      {!props.isLoading ? <ArrowRight className="size-4" aria-hidden /> : null}
    </ActionButton>
  );
}

export function DeleteButton({
  children = "Delete",
  ...props
}: BaseButtonProps) {
  return (
    <ActionButton variant="destructive" {...props}>
      <Trash2 className="size-4" aria-hidden />
      {children}
    </ActionButton>
  );
}

type FormActionsProps = {
  children: ReactNode;
  className?: string;
  align?: "start" | "end" | "between";
};

export function FormActions({
  children,
  className,
  align = "end",
}: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-border pt-4",
        align === "start" && "justify-start",
        align === "end" && "justify-end",
        align === "between" && "justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}
