"use client";

import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { FormRow } from "@/components/forms/form-row";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import {
  TextField,
  TextareaField,
  CurrencyField,
  NumberField,
  SelectField,
  MultiSelectField,
  SwitchField,
  ImageUploadPlaceholder,
} from "@/components/forms/fields";
import {
  menuItemFormSchema,
  type MenuItemFormValues,
} from "@/components/forms/examples/schemas";

const defaultValues: MenuItemFormValues = {
  name: "Truffle Pasta",
  category: "mains",
  description: "Handmade pasta with black truffle cream",
  price: 22,
  preparationTime: 18,
  isAvailable: true,
  tags: ["chef-special", "vegetarian"],
  image: "",
};

export function MenuItemFormExample() {
  return (
    <FormWrapper
      schema={menuItemFormSchema}
      defaultValues={defaultValues}
      card
      title="Menu Item Form"
      description="UI-only example — no submission"
    >
      {() => (
        <>
          <FormSection title="Item details">
            <FormRow columns={2}>
              <TextField name="name" label="Name" required />
              <SelectField
                name="category"
                label="Category"
                required
                options={[
                  { label: "Mains", value: "mains" },
                  { label: "Starters", value: "starters" },
                  { label: "Desserts", value: "desserts" },
                ]}
              />
              <TextareaField
                name="description"
                label="Description"
                className="md:col-span-2"
              />
              <CurrencyField name="price" label="Price" required />
              <NumberField name="preparationTime" label="Prep time (min)" min={0} />
              <MultiSelectField
                name="tags"
                label="Tags"
                options={[
                  { label: "Chef special", value: "chef-special" },
                  { label: "Vegetarian", value: "vegetarian" },
                  { label: "Gluten free", value: "gluten-free" },
                ]}
                className="md:col-span-2"
              />
              <SwitchField name="isAvailable" label="Available" />
              <ImageUploadPlaceholder name="image" label="Item image" />
            </FormRow>
          </FormSection>
          <FormActions>
            <CancelButton />
            <SaveButton />
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
