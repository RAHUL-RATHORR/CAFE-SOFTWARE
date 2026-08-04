"use client";

import { Form } from "@/components/forms/form";
import {
  EmailField,
  PhoneField,
  TextField,
  TextareaField,
  ImageUploadPlaceholder,
} from "@/components/forms/fields";
import { FormRow } from "@/components/forms/form-row";
import { StepHeader } from "@/components/onboarding/step-header";
import { StepFooter } from "@/components/onboarding/step-footer";
import { SlideIn } from "@/components/design-system/motion";
import {
  restaurantInformationSchema,
  slugifyRestaurantName,
  type RestaurantInformationValues,
} from "@/lib/onboarding";

type RestaurantInformationStepProps = {
  defaultValues: RestaurantInformationValues;
  onPrevious: () => void;
  onSubmit: (values: RestaurantInformationValues) => void;
};

export function RestaurantInformationStep({
  defaultValues,
  onPrevious,
  onSubmit,
}: RestaurantInformationStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel="Step 2 of 8"
        title="Restaurant Information"
        description="Define how your restaurant appears across the workspace."
      />
      <Form
        schema={restaurantInformationSchema}
        defaultValues={defaultValues}
        onSubmit={(values) => {
          onSubmit({
            ...values,
            slug: values.slug || slugifyRestaurantName(values.name),
          });
        }}
        className="space-y-6"
      >
        {() => (
          <>
            <FormRow columns={2}>
              <TextField
                name="name"
                label="Restaurant Name"
                placeholder="Sunset Bistro"
                required
              />
              <TextField
                name="slug"
                label="Slug"
                placeholder="sunset-bistro"
                description="Lowercase letters, numbers, and hyphens"
                required
              />
            </FormRow>
            <FormRow columns={2}>
              <EmailField
                name="businessEmail"
                label="Business Email"
                placeholder="hello@restaurant.com"
                required
              />
              <PhoneField
                name="phone"
                label="Phone"
                placeholder="+91 98765 43210"
                required
              />
            </FormRow>
            <TextareaField
              name="description"
              label="Description"
              placeholder="A short description of your restaurant"
              rows={3}
            />
            <ImageUploadPlaceholder
              name="logoPlaceholder"
              label="Logo"
              description="Logo upload placeholder — no file is stored"
            />
            <StepFooter
              nextType="submit"
              nextLabel="Continue"
              onPrevious={onPrevious}
            />
          </>
        )}
      </Form>
    </SlideIn>
  );
}
