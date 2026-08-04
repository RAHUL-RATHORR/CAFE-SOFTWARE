import type { ReactNode } from "react";
import { FormLabel } from "@/components/forms/form-label";
import { FormDescription } from "@/components/forms/form-description";
import { FormErrorMessage } from "@/components/forms/form-error-message";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label?: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <FormLabel htmlFor={htmlFor} required={required}>
          {label}
        </FormLabel>
      ) : null}
      {children}
      {description && !error ? (
        <FormDescription>{description}</FormDescription>
      ) : null}
      <FormErrorMessage message={error} />
    </div>
  );
}
