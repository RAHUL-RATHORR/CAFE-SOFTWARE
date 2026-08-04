"use client";

import { Form } from "@/components/forms/form";
import { SelectField } from "@/components/forms/fields";
import { FormRow } from "@/components/forms/form-row";
import { StepHeader } from "@/components/onboarding/step-header";
import { StepFooter } from "@/components/onboarding/step-footer";
import { SlideIn } from "@/components/design-system/motion";
import { currencyOptions, timezoneOptions } from "@/config/onboarding";
import {
  currencyTimezoneSchema,
  type CurrencyTimezoneValues,
} from "@/lib/onboarding";

type CurrencyTimezoneStepProps = {
  defaultValues: CurrencyTimezoneValues;
  onPrevious: () => void;
  onSubmit: (values: CurrencyTimezoneValues) => void;
};

export function CurrencyTimezoneStep({
  defaultValues,
  onPrevious,
  onSubmit,
}: CurrencyTimezoneStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel="Step 5 of 8"
        title="Currency & Timezone"
        description="Set regional defaults for pricing and schedules."
      />
      <Form
        schema={currencyTimezoneSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        className="space-y-6"
      >
        {() => (
          <>
            <FormRow columns={2}>
              <SelectField
                name="currency"
                label="Currency"
                options={currencyOptions}
                required
              />
              <SelectField
                name="timezone"
                label="Timezone"
                options={timezoneOptions}
                required
              />
            </FormRow>
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
