import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formLayoutClassName } from "@/components/forms/field-styles";
import type { FormLayout } from "@/types";

type FormRowProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3 | FormLayout;
  className?: string;
};

export function FormRow({ children, columns = 2, className }: FormRowProps) {
  const layoutKey =
    columns === 1
      ? "single"
      : columns === 2
        ? "two-column"
        : columns === 3
          ? "three-column"
          : columns;

  return (
    <div className={cn(formLayoutClassName[layoutKey] ?? formLayoutClassName.single, className)}>
      {children}
    </div>
  );
}
