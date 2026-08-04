"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { InputField } from "@/components/forms/fields/input-field";
import type { FormFieldBaseProps } from "@/types";

type TextFieldProps<T extends FieldValues> = FormFieldBaseProps & {
  name: FieldPath<T>;
};

export function TextField<T extends FieldValues = FieldValues>(
  props: TextFieldProps<T>
) {
  return <InputField<T> {...props} type="text" />;
}

export function EmailField<T extends FieldValues = FieldValues>(
  props: TextFieldProps<T>
) {
  return <InputField<T> {...props} type="email" autoComplete="email" />;
}

export function PasswordField<T extends FieldValues = FieldValues>(
  props: TextFieldProps<T>
) {
  return (
    <InputField<T>
      {...props}
      type="password"
      autoComplete="current-password"
    />
  );
}

export function PhoneField<T extends FieldValues = FieldValues>(
  props: TextFieldProps<T>
) {
  return <InputField<T> {...props} type="tel" autoComplete="tel" />;
}

export function NumberField<T extends FieldValues = FieldValues>(
  props: TextFieldProps<T> & { min?: number; max?: number; step?: number }
) {
  return (
    <InputField<T>
      {...props}
      type="number"
      inputMode="decimal"
      min={props.min}
      max={props.max}
      step={props.step ?? "any"}
    />
  );
}

export function CurrencyField<T extends FieldValues = FieldValues>(
  props: TextFieldProps<T>
) {
  return (
    <InputField<T>
      {...props}
      type="number"
      inputMode="decimal"
      min={0}
      step="0.01"
      placeholder={props.placeholder ?? "0.00"}
    />
  );
}
