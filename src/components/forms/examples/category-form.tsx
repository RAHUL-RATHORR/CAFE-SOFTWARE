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
  NumberField,
  SwitchField,
} from "@/components/forms/fields";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/components/forms/examples/schemas";

const defaultValues: CategoryFormValues = {
  name: "Signature Mains",
  slug: "signature-mains",
  description: "Chef specialties and seasonal plates",
  sortOrder: 1,
  isVisible: true,
};

export function CategoryFormExample() {
  return (
    <FormWrapper
      schema={categoryFormSchema}
      defaultValues={defaultValues}
      card
      title="Category Form"
      description="UI-only example — no submission"
    >
      {() => (
        <>
          <FormSection title="Category details">
            <FormRow columns={2}>
              <TextField name="name" label="Name" required />
              <TextField name="slug" label="Slug" required />
              <TextareaField
                name="description"
                label="Description"
                className="md:col-span-2"
              />
              <NumberField name="sortOrder" label="Sort order" min={0} />
              <SwitchField name="isVisible" label="Visible on menu" />
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
