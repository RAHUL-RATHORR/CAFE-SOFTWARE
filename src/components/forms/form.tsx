"use client";

import type { ReactNode } from "react";
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";

type FormProps<T extends FieldValues> = {
  schema: ZodType<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  children: (form: UseFormReturn<T>) => ReactNode;
  className?: string;
};

/**
 * Foundation form wrapper. Wire real submissions in feature modules later.
 */
export function Form<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
}: FormProps<T>) {
  const form = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form
        className={className}
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit?.(values);
        })}
        noValidate
      >
        {children(form)}
      </form>
    </FormProvider>
  );
}
