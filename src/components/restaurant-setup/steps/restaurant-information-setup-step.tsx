"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Form } from "@/components/forms/form";
import {
  EmailField,
  ImageUploadPlaceholder,
  PhoneField,
  TextField,
  TextareaField,
} from "@/components/forms/fields";
import { FormRow } from "@/components/forms/form-row";
import { StepHeader } from "@/components/onboarding/step-header";
import { WizardFooter } from "@/components/restaurant-setup/wizard-layout";
import { SlideIn } from "@/components/design-system/motion";
import {
  restaurantInformationSetupSchema,
  slugifyRestaurantName,
  type RestaurantInformationSetupValues,
} from "@/lib/restaurant-setup";

type RestaurantInformationSetupStepProps = {
  stepLabel: string;
  defaultValues: RestaurantInformationSetupValues;
  onPrevious: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  onSubmit: (values: RestaurantInformationSetupValues) => void;
};

export function RestaurantInformationSetupStep({
  stepLabel,
  defaultValues,
  onPrevious,
  onSaveDraft,
  onCancel,
  onSubmit,
}: RestaurantInformationSetupStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel={stepLabel}
        title="Restaurant Information"
        description="Capture restaurant identity and owner account details. Credentials are prepared later."
      />
      <Form
        schema={restaurantInformationSetupSchema}
        defaultValues={defaultValues}
        onSubmit={(values) => {
          onSubmit({
            ...values,
            slug: values.slug || slugifyRestaurantName(values.restaurantName),
          });
        }}
        className="space-y-6"
      >
        {(form) => (
          <SlugAutoSync form={form}>
            <FormRow columns={2}>
              <TextField
                name="restaurantName"
                label="Restaurant Name"
                placeholder="Sunset Bistro"
                required
              />
              <TextField
                name="slug"
                label="Slug"
                placeholder="sunset-bistro"
                description="Auto-generated from name; editable"
                required
              />
            </FormRow>
            <FormRow columns={2}>
              <TextField
                name="ownerName"
                label="Owner Name"
                placeholder="Priya Sharma"
                required
              />
              <EmailField
                name="ownerEmail"
                label="Owner Email"
                placeholder="owner@restaurant.com"
                required
              />
            </FormRow>
            <FormRow columns={2}>
              <PhoneField
                name="ownerMobile"
                label="Owner Mobile"
                placeholder="+91 98765 43210"
                required
              />
              <PhoneField
                name="restaurantPhone"
                label="Restaurant Phone"
                placeholder="+91 11 2345 6789"
                required
              />
            </FormRow>
            <TextField
              name="gstNumber"
              label="GST Number"
              placeholder="22AAAAA0000A1Z5"
              description="Optional"
            />
            <TextareaField
              name="description"
              label="Description"
              placeholder="A short description of the restaurant"
              rows={3}
            />
            <ImageUploadPlaceholder
              name="logoPlaceholder"
              label="Logo"
              description="UI placeholder — no file is stored"
            />
            <WizardFooter
              nextType="submit"
              nextLabel="Next"
              onBack={onPrevious}
              onSaveDraft={onSaveDraft}
              onCancel={onCancel}
              hideBack
            />
          </SlugAutoSync>
        )}
      </Form>
    </SlideIn>
  );
}

function SlugAutoSync({
  form,
  children,
}: {
  form: UseFormReturn<RestaurantInformationSetupValues>;
  children: ReactNode;
}) {
  const restaurantName = form.watch("restaurantName");
  const manualSlug = useRef(Boolean(form.getValues("slug")));
  const lastAuto = useRef(slugifyRestaurantName(restaurantName || ""));

  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (info.name === "slug") {
        const next = values.slug ?? "";
        if (next && next !== lastAuto.current) {
          manualSlug.current = true;
        }
        if (!next) {
          manualSlug.current = false;
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (manualSlug.current) return;
    const next = slugifyRestaurantName(restaurantName || "");
    lastAuto.current = next;
    if (form.getValues("slug") !== next) {
      form.setValue("slug", next, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [form, restaurantName]);

  return <>{children}</>;
}
