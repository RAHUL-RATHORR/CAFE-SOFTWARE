import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { FieldState } from "@/types";

export const fieldControlVariants = cva(
  "w-full rounded-xl border bg-background px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted/40",
  {
    variants: {
      state: {
        default: "border-input",
        error:
          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        success:
          "border-success focus-visible:border-success focus-visible:ring-success/20",
        disabled: "border-input opacity-50",
        readonly: "border-input bg-muted/40",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

export function resolveFieldState(params: {
  state?: FieldState;
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}): FieldState {
  if (params.state) return params.state;
  if (params.disabled) return "disabled";
  if (params.readOnly) return "readonly";
  if (params.error) return "error";
  return "default";
}

export function fieldControlClassName(
  options: VariantProps<typeof fieldControlVariants> & { className?: string }
) {
  return cn(fieldControlVariants({ state: options.state }), options.className);
}

export const formLayoutClassName: Record<string, string> = {
  single: "grid grid-cols-1 gap-4",
  "two-column": "grid grid-cols-1 gap-4 md:grid-cols-2",
  "three-column": "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
  responsive: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
};
