"use client";

import { Form } from "@/components/forms/form";
import {
  SelectField,
  ColorPickerPlaceholder,
  ImageUploadPlaceholder,
} from "@/components/forms/fields";
import { FormRow } from "@/components/forms/form-row";
import { StepHeader } from "@/components/onboarding/step-header";
import { StepFooter } from "@/components/onboarding/step-footer";
import { SlideIn } from "@/components/design-system/motion";
import { themePreferenceOptions } from "@/config/onboarding";
import { brandingSchema, type BrandingValues } from "@/lib/onboarding";

type BrandingStepProps = {
  defaultValues: BrandingValues;
  onPrevious: () => void;
  onSubmit: (values: BrandingValues) => void;
};

export function BrandingStep({
  defaultValues,
  onPrevious,
  onSubmit,
}: BrandingStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel="Step 6 of 8"
        title="Branding"
        description="Choose brand colors and theme preferences for your workspace."
      />
      <Form
        schema={brandingSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        className="space-y-6"
      >
        {() => (
          <>
            <FormRow columns={2}>
              <ImageUploadPlaceholder
                name="logoUrl"
                label="Restaurant Logo"
                description="Logo placeholder — no upload"
              />
              <ImageUploadPlaceholder
                name="receiptLogoUrl"
                label="Receipt Logo"
                description="Receipt logo placeholder"
              />
            </FormRow>
            <FormRow columns={2}>
              <ColorPickerPlaceholder
                name="primaryColor"
                label="Primary Color"
                required
              />
              <ColorPickerPlaceholder
                name="secondaryColor"
                label="Secondary Color"
                required
              />
            </FormRow>
            <SelectField
              name="themePreference"
              label="Theme Preference"
              options={themePreferenceOptions}
              required
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
