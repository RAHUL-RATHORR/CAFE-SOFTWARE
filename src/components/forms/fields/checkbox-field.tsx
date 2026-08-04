"use client";

import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { cn } from "@/lib/utils";
import type { FormFieldBaseProps } from "@/types";

type CheckboxFieldProps<T extends FieldValues> = FormFieldBaseProps & {
  name: FieldPath<T>;
  checkboxLabel?: string;
};

export function CheckboxField<T extends FieldValues = FieldValues>({
  name,
  label,
  checkboxLabel,
  description,
  required,
  disabled,
  className,
}: CheckboxFieldProps<T>) {
  const { control } = useFormContext<T>();
  const inputId = `field-${String(name)}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormField
          label={label}
          description={description}
          error={fieldState.error?.message}
          required={required}
          className={className}
        >
          <label
            htmlFor={inputId}
            className={cn(
              "flex items-start gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-sm",
              disabled && "opacity-50"
            )}
          >
            <input
              id={inputId}
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={!!field.value}
              disabled={disabled}
              onChange={(event) => field.onChange(event.target.checked)}
              onBlur={field.onBlur}
              ref={field.ref}
            />
            <span>{checkboxLabel ?? label ?? name}</span>
          </label>
        </FormField>
      )}
    />
  );
}
