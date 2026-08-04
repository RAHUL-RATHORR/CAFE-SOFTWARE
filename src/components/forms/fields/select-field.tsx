"use client";

import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import {
  fieldControlClassName,
  resolveFieldState,
} from "@/components/forms/field-styles";
import type { FormFieldBaseProps, SelectOption } from "@/types";

type SelectFieldProps<T extends FieldValues> = FormFieldBaseProps & {
  name: FieldPath<T>;
  options: SelectOption[];
};

export function SelectField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  placeholder = "Select an option",
  required,
  disabled,
  className,
  state,
  options,
}: SelectFieldProps<T>) {
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
            <div className="relative">
              <select
                {...field}
                id={inputId}
                disabled={disabled || resolved === "disabled"}
                aria-invalid={!!fieldState.error}
                value={field.value ?? ""}
                className={fieldControlClassName({
                  state: resolved,
                  className: "h-10 appearance-none pr-9",
                })}
              >
                <option value="" disabled>
                  {placeholder}
                </option>
                {options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          </FormField>
        );
      }}
    />
  );
}
