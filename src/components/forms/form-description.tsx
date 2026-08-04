import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export function FormDescription({ children, className }: FormDescriptionProps) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>
  );
}
