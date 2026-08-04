import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { ZodType } from "zod";

export type FormLayout = "single" | "two-column" | "three-column" | "responsive";

export type FieldState = "default" | "error" | "success" | "disabled" | "readonly";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type FormFieldBaseProps = {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  state?: FieldState;
};

export type FormWrapperProps<T extends FieldValues> = {
  schema: ZodType<T>;
  defaultValues?: Partial<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  children: (form: UseFormReturn<T>) => ReactNode;
  className?: string;
  layout?: FormLayout;
  isLoading?: boolean;
  card?: boolean;
  title?: string;
  description?: string;
};
