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

type SwitchFieldProps<T extends FieldValues> = FormFieldBaseProps & {
  name: FieldPath<T>;
};

export function SwitchField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  required,
  disabled,
  className,
}: SwitchFieldProps<T>) {
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
          <button
            id={inputId}
            type="button"
            role="switch"
            aria-checked={!!field.value}
            disabled={disabled}
            onClick={() => field.onChange(!field.value)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              field.value ? "bg-primary" : "bg-muted",
              disabled && "opacity-50"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                field.value && "translate-x-5"
              )}
            />
          </button>
        </FormField>
      )}
    />
  );
}
