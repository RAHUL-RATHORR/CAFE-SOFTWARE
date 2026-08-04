"use client";

import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { cn } from "@/lib/utils";
import type { FormFieldBaseProps, SelectOption } from "@/types";

type RadioGroupFieldProps<T extends FieldValues> = FormFieldBaseProps & {
  name: FieldPath<T>;
  options: SelectOption[];
  orientation?: "horizontal" | "vertical";
};

export function RadioGroupField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  required,
  disabled,
  className,
  options,
  orientation = "vertical",
}: RadioGroupFieldProps<T>) {
  const { control } = useFormContext<T>();

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
          <div
            role="radiogroup"
            aria-label={label}
            className={cn(
              "flex gap-3",
              orientation === "vertical" ? "flex-col" : "flex-wrap"
            )}
          >
            {options.map((option) => {
              const id = `${String(name)}-${option.value}`;
              return (
                <label
                  key={option.value}
                  htmlFor={id}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm",
                    field.value === option.value && "border-primary bg-accent/40",
                    (disabled || option.disabled) && "opacity-50"
                  )}
                >
                  <input
                    id={id}
                    type="radio"
                    className="size-3.5 accent-primary"
                    value={option.value}
                    checked={field.value === option.value}
                    disabled={disabled || option.disabled}
                    onChange={() => field.onChange(option.value)}
                    onBlur={field.onBlur}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </FormField>
      )}
    />
  );
}
