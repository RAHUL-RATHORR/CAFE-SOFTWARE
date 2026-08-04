import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { RequiredBadge } from "@/components/forms/required-badge";
import { cn } from "@/lib/utils";

type FormLabelProps = {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
};

export function FormLabel({
  htmlFor,
  children,
  required = false,
  className,
}: FormLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={cn("gap-2", className)}>
      <span>{children}</span>
      {required ? <RequiredBadge /> : null}
    </Label>
  );
}
