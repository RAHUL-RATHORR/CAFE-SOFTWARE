"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormRow } from "@/components/forms/form-row";
import {
  TextField,
  TextareaField,
  NumberField,
  SwitchField,
  ColorPickerPlaceholder,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import {
  createCategorySchema,
  type CreateCategoryInput,
} from "@/lib/validators/category";
import { slugifyCategoryName } from "@/lib/categories";
import { createCategory, updateCategory } from "@/actions/categories";
import { toast } from "@/store/toast-store";
import type { Category } from "@/types/category";
import type { ZodType } from "zod";

type CategoryFormProps = {
  mode: "create" | "edit";
  category?: Category;
};

type FormValues = CreateCategoryInput;

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues: FormValues = {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    image: category?.image ?? "",
    displayOrder: category?.displayOrder ?? 0,
    color: category?.color ?? "#2563EB",
    icon: category?.icon ?? "",
    isActive: category?.isActive ?? true,
    branchId: category?.branchId ?? null,
  };

  function handleSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        slug: values.slug || slugifyCategoryName(values.name),
        image: values.image || "",
        icon: values.icon || "",
        color: values.color || "#2563EB",
      };

      const result =
        mode === "create"
          ? await createCategory(payload)
          : await updateCategory({ id: category!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Category created" : "Category updated",
        result.data.name
      );
      router.push(`/categories/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <FormWrapper
      schema={createCategorySchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      className="space-y-6"
    >
      {() => (
        <>
          <FormRow columns={2}>
            <TextField
              name="name"
              label="Name"
              placeholder="Beverages"
              required
            />
            <TextField
              name="slug"
              label="Slug"
              placeholder="beverages"
              description="Lowercase letters, numbers, and hyphens"
              required
            />
          </FormRow>

          <TextareaField
            name="description"
            label="Description"
            placeholder="Optional description"
            rows={3}
          />

          <FormRow columns={2}>
            <NumberField
              name="displayOrder"
              label="Display order"
              min={0}
              step={1}
            />
            <TextField
              name="icon"
              label="Icon"
              placeholder="Optional icon key"
              description="Icon placeholder"
            />
          </FormRow>

          <FormRow columns={2}>
            <ColorPickerPlaceholder name="color" label="Color" />
            <TextField
              name="image"
              label="Image URL"
              placeholder="https://…"
              description="Optional image URL"
            />
          </FormRow>

          <SwitchField name="isActive" label="Active" />

          <FormActions>
            <CancelButton
              type="button"
              onClick={() =>
                router.push(
                  mode === "edit" && category
                    ? `/categories/${category.id}`
                    : "/categories"
                )
              }
            />
            <SaveButton isLoading={isPending}>
              {mode === "create" ? "Create category" : "Save changes"}
            </SaveButton>
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
