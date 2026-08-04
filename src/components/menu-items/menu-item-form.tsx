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
  SelectField,
  ImageUploadPlaceholder,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import {
  createMenuItemSchema,
  type CreateMenuItemInput,
} from "@/lib/validators/menu-item";
import { slugifyMenuItemName } from "@/lib/menu-items";
import { createMenuItem, updateMenuItem } from "@/actions/menu-items";
import { toast } from "@/store/toast-store";
import type { CategoryOption, MenuItem } from "@/types/menu-item";
import type { ZodType } from "zod";

type MenuItemFormProps = {
  mode: "create" | "edit";
  item?: MenuItem;
  categoryOptions: CategoryOption[];
};

type FormValues = CreateMenuItemInput;

export function MenuItemForm({
  mode,
  item,
  categoryOptions,
}: MenuItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues: FormValues = {
    categoryId: item?.categoryId ?? categoryOptions[0]?.value ?? "",
    name: item?.name ?? "",
    slug: item?.slug ?? "",
    description: item?.description ?? "",
    shortDescription: item?.shortDescription ?? "",
    sku: item?.sku ?? "",
    image: item?.image ?? "",
    gallery: item?.gallery ?? [],
    price: item?.price ?? 0,
    discountPrice: item?.discountPrice ?? null,
    taxRate: item?.taxRate ?? 0,
    preparationTime: item?.preparationTime ?? 0,
    calories: item?.calories ?? null,
    isVeg: item?.isVeg ?? true,
    isAvailable: item?.isAvailable ?? true,
    isFeatured: item?.isFeatured ?? false,
    displayOrder: item?.displayOrder ?? 0,
    tags: ((item?.tags ?? []).join(", ") || "") as unknown as string[],
    branchId: item?.branchId ?? null,
  };

  function handleSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        slug: values.slug || slugifyMenuItemName(values.name),
        image: values.image || "",
        sku: values.sku || "",
        tags: Array.isArray(values.tags)
          ? values.tags
          : String(values.tags ?? "")
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
      };

      const result =
        mode === "create"
          ? await createMenuItem(payload)
          : await updateMenuItem({ id: item!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Menu item created" : "Menu item updated",
        result.data.name
      );
      router.push(`/menu-items/${result.data.id}`);
      router.refresh();
    });
  }

  if (categoryOptions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
        Create at least one active category before adding menu items.
      </div>
    );
  }

  return (
    <FormWrapper
      schema={createMenuItemSchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      className="space-y-6"
    >
      {() => (
        <>
          <SelectField
            name="categoryId"
            label="Category"
            options={categoryOptions}
            required
          />

          <FormRow columns={2}>
            <TextField name="name" label="Name" placeholder="Masala Dosa" required />
            <TextField
              name="slug"
              label="Slug"
              placeholder="masala-dosa"
              description="Lowercase letters, numbers, and hyphens"
              required
            />
          </FormRow>

          <TextareaField
            name="description"
            label="Description"
            placeholder="Full description"
            rows={3}
          />

          <TextField
            name="shortDescription"
            label="Short description"
            placeholder="Brief summary for cards"
          />

          <FormRow columns={2}>
            <TextField
              name="sku"
              label="SKU"
              placeholder="Optional SKU"
              description="Unique per restaurant when set"
            />
            <NumberField
              name="displayOrder"
              label="Display order"
              min={0}
              step={1}
            />
          </FormRow>

          <FormRow columns={3}>
            <NumberField name="price" label="Price" min={0} step={0.01} required />
            <NumberField
              name="discountPrice"
              label="Discount price"
              min={0}
              step={0.01}
            />
            <NumberField name="taxRate" label="Tax %" min={0} max={100} step={0.1} />
          </FormRow>

          <FormRow columns={2}>
            <NumberField
              name="preparationTime"
              label="Preparation time (min)"
              min={0}
              step={1}
            />
            <NumberField name="calories" label="Calories" min={0} step={1} />
          </FormRow>

          <TextField
            name="tags"
            label="Tags"
            placeholder="spicy, breakfast, chef-special"
            description="Comma-separated tags"
          />

          <ImageUploadPlaceholder
            name="gallery"
            label="Image upload"
            description="Upload architecture placeholder — paste a URL below for now"
          />
          <TextField
            name="image"
            label="Image URL"
            placeholder="https://…"
            description="Prepared for Cloudinary / S3 / UploadThing"
          />

          <FormRow columns={3}>
            <SwitchField name="isVeg" label="Vegetarian" />
            <SwitchField name="isAvailable" label="Available" />
            <SwitchField name="isFeatured" label="Featured" />
          </FormRow>

          <FormActions>
            <CancelButton
              type="button"
              onClick={() =>
                router.push(
                  mode === "edit" && item
                    ? `/menu-items/${item.id}`
                    : "/menu-items"
                )
              }
            />
            <SaveButton isLoading={isPending}>
              {mode === "create" ? "Create item" : "Save changes"}
            </SaveButton>
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
