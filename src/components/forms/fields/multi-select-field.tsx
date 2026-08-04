"use client";

import { useEffect, useRef, useState } from "react";
import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { ChevronsUpDown } from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import {
  fieldControlClassName,
  resolveFieldState,
} from "@/components/forms/field-styles";
import type { FormFieldBaseProps, SelectOption } from "@/types";

type MultiSelectFieldProps<T extends FieldValues> = FormFieldBaseProps & {
  name: FieldPath<T>;
  options: SelectOption[];
};

/**
 * UI multi-select using checkbox list. Values stored as string[].
 */
export function MultiSelectField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  placeholder = "Select options",
  required,
  disabled,
  className,
  state,
  options,
}: MultiSelectFieldProps<T>) {
  const { control } = useFormContext<T>();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputId = `field-${String(name)}`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = Array.isArray(field.value) ? (field.value as string[]) : [];
        const resolved = resolveFieldState({
          state,
          error: !!fieldState.error,
          disabled,
        });
        const summary =
          selected.length === 0
            ? placeholder
            : `${selected.length} selected`;

        return (
          <FormField
            label={label}
            htmlFor={inputId}
            description={description}
            error={fieldState.error?.message}
            required={required}
            className={className}
          >
            <div ref={rootRef} className="relative">
              <button
                id={inputId}
                type="button"
                role="combobox"
                disabled={disabled || resolved === "disabled"}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={`${inputId}-listbox`}
                aria-describedby={
                  fieldState.error ? `${inputId}-error` : undefined
                }
                className={fieldControlClassName({
                  state: resolved,
                  className:
                    "flex h-10 items-center justify-between text-left",
                })}
                onClick={() => setOpen((current) => !current)}
              >
                <span className={selected.length ? "text-foreground" : "text-muted-foreground"}>
                  {summary}
                </span>
                <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
              </button>

              {open ? (
                <div
                  id={`${inputId}-listbox`}
                  role="listbox"
                  aria-multiselectable="true"
                  className="absolute z-40 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-border bg-popover p-2 shadow-md"
                >
                  {options.map((option) => {
                    const checked = selected.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          className="size-3.5 accent-primary"
                          checked={checked}
                          disabled={option.disabled}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...selected, option.value]
                              : selected.filter((value) => value !== option.value);
                            field.onChange(next);
                          }}
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </FormField>
        );
      }}
    />
  );
}
