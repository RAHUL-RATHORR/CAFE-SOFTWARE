"use client";

import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Calendar, Clock, ImageIcon, Palette, Upload } from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import {
  fieldControlClassName,
  resolveFieldState,
} from "@/components/forms/field-styles";
import { cn } from "@/lib/utils";
import type { FormFieldBaseProps } from "@/types";

type PlaceholderFieldProps<T extends FieldValues> = FormFieldBaseProps & {
  name: FieldPath<T>;
};

export function DatePickerPlaceholder<T extends FieldValues = FieldValues>({
  name,
  label = "Date",
  description = "Date picker placeholder — wire a calendar later",
  required,
  disabled,
  className,
  state,
}: PlaceholderFieldProps<T>) {
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
              <input
                {...field}
                id={inputId}
                type="date"
                disabled={disabled}
                value={field.value ?? ""}
                className={fieldControlClassName({ state: resolved, className: "h-10" })}
              />
              <Calendar
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

export function TimePickerPlaceholder<T extends FieldValues = FieldValues>({
  name,
  label = "Time",
  description = "Time picker placeholder",
  required,
  disabled,
  className,
  state,
}: PlaceholderFieldProps<T>) {
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
              <input
                {...field}
                id={inputId}
                type="time"
                disabled={disabled}
                value={field.value ?? ""}
                className={fieldControlClassName({ state: resolved, className: "h-10" })}
              />
              <Clock
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

export function FileUploadPlaceholder<T extends FieldValues = FieldValues>({
  name,
  label = "File upload",
  description = "File upload placeholder — no real upload",
  required,
  disabled,
  className,
}: PlaceholderFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ fieldState }) => (
        <FormField
          label={label}
          description={description}
          error={fieldState.error?.message}
          required={required}
          className={className}
        >
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center",
              disabled && "opacity-50"
            )}
          >
            <Upload className="size-5 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Drop files here</p>
            <p className="text-xs text-muted-foreground">UI placeholder only</p>
          </div>
        </FormField>
      )}
    />
  );
}

export function ImageUploadPlaceholder<T extends FieldValues = FieldValues>({
  name,
  label = "Image upload",
  description = "Image upload placeholder — no real upload",
  required,
  disabled,
  className,
}: PlaceholderFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ fieldState }) => (
        <FormField
          label={label}
          description={description}
          error={fieldState.error?.message}
          required={required}
          className={className}
        >
          <div
            className={cn(
              "flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-center",
              disabled && "opacity-50"
            )}
          >
            <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Upload image</p>
            <p className="text-xs text-muted-foreground">UI placeholder only</p>
          </div>
        </FormField>
      )}
    />
  );
}

export function ColorPickerPlaceholder<T extends FieldValues = FieldValues>({
  name,
  label = "Color",
  description = "Color picker placeholder",
  required,
  disabled,
  className,
  state,
}: PlaceholderFieldProps<T>) {
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
            <div className="flex items-center gap-2">
              <input
                {...field}
                id={inputId}
                type="color"
                disabled={disabled}
                value={field.value || "#2563EB"}
                className="size-10 cursor-pointer rounded-xl border border-input bg-background p-1"
              />
              <div
                className={fieldControlClassName({
                  state: resolved,
                  className: "flex h-10 flex-1 items-center gap-2",
                })}
              >
                <Palette className="size-4 text-muted-foreground" aria-hidden />
                <span className="font-mono text-xs uppercase">
                  {field.value || "#2563EB"}
                </span>
              </div>
            </div>
          </FormField>
        );
      }}
    />
  );
}
