import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const dsBadgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        danger: "border-transparent bg-destructive text-white",
        info: "border-transparent bg-sky-500 text-white",
        outline: "border-border bg-transparent text-foreground",
        soft: "border-transparent bg-primary/10 text-primary",
        filled: "border-transparent bg-foreground text-background",
        ghost: "border-transparent bg-transparent text-muted-foreground",
      },
      size: {
        sm: "h-5 px-2 text-[10px]",
        md: "h-6 px-2.5 text-xs",
        lg: "h-7 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "soft",
      size: "md",
    },
  }
);

type DsBadgeProps = VariantProps<typeof dsBadgeVariants> & {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

/**
 * Design-system badge. Complements shadcn Badge without replacing it.
 */
export function DsBadge({
  children,
  icon,
  variant,
  size,
  className,
}: DsBadgeProps) {
  return (
    <span className={cn(dsBadgeVariants({ variant, size }), className)}>
      {icon}
      {children}
    </span>
  );
}
