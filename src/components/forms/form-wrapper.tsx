"use client";

import type { DefaultValues, FieldValues } from "react-hook-form";
import { Form } from "@/components/forms/form";
import { AppCard } from "@/components/cards/app-card";
import { cn } from "@/lib/utils";
import type { FormWrapperProps } from "@/types";

/**
 * Enterprise form wrapper with optional card shell.
 * Use FormRow / FormSection inside for layout columns.
 * Submits are optional — omit onSubmit for UI-only forms.
 */
export function FormWrapper<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  isLoading = false,
  card = false,
  title,
  description,
}: FormWrapperProps<T>) {
  const content = (
    <Form
      schema={schema}
      defaultValues={defaultValues as DefaultValues<T> | undefined}
      onSubmit={onSubmit}
      className={cn(
        "space-y-6",
        isLoading && "pointer-events-none opacity-70",
        className
      )}
    >
      {(form) => children(form)}
    </Form>
  );

  if (!card && !title) {
    return content;
  }

  return (
    <AppCard title={title} description={description} className="shadow-sm">
      {content}
    </AppCard>
  );
}
