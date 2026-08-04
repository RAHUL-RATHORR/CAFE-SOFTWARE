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

type InputFieldProps<T extends FieldValues> = FormFieldBaseProps & {
  name: FieldPath<T>;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: number | string;
  max?: number | string;
  step?: number | string;
  autoComplete?: string;
};

export function InputField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  readOnly,
  className,
  state,
  type = "text",
  inputMode,
  min,
  max,
  step,
  autoComplete,
}: InputFieldProps<T>) {
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
            <input
              {...field}
              id={inputId}
              type={type}
              inputMode={inputMode}
              min={min}
              max={max}
              step={step}
              autoComplete={autoComplete}
              placeholder={placeholder}
              disabled={disabled || resolved === "disabled"}
              readOnly={readOnly || resolved === "readonly"}
              aria-invalid={!!fieldState.error}
              value={field.value ?? ""}
              className={fieldControlClassName({
                state: resolved,
                className: "h-10",
              })}
            />
          </FormField>
        );
      }}
    />
  );
}
