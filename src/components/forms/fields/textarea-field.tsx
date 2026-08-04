"use client";

import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import {
  fieldControlClassName,
  resolveFieldState,
} from "@/components/forms/field-styles";
import type { FormFieldBaseProps } from "@/types";

type TextareaFieldProps<T extends FieldValues> = FormFieldBaseProps & {
  name: FieldPath<T>;
  rows?: number;
};

export function TextareaField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  readOnly,
  className,
  state,
  rows = 4,
}: TextareaFieldProps<T>) {
  const { control } = useFormContext<T>();
  const inputId = `field-${String(name)}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const resolved = resolveFieldState({
          state,
          error: !!fieldState.error,
          disabled,
          readOnly,
        });

        return (
          <FormField
            label={label}
            htmlFor={inputId}
            description={description}
            error={fieldState.error?.message}
            required={required}
            className={className}
          >
            <textarea
              {...field}
              id={inputId}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled || resolved === "disabled"}
              readOnly={readOnly || resolved === "readonly"}
              aria-invalid={!!fieldState.error}
              value={field.value ?? ""}
              className={fieldControlClassName({
                state: resolved,
                className: "min-h-24 resize-y",
              })}
            />
          </FormField>
        );
      }}
    />
  );
}
