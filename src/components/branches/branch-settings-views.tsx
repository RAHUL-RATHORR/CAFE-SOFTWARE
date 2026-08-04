"use client";

import { Form } from "@/components/forms/form";
import {
  TextField,
  EmailField,
  PhoneField,
  SelectField,
  SwitchField,
} from "@/components/forms/fields";
import { FormRow } from "@/components/forms/form-row";
import { BranchSettingsPlaceholder } from "@/components/branches/branch-settings-layout";
import { useBranch } from "@/hooks/branches";
import {
  branchAddressSchema,
  branchBusinessHoursSchema,
  branchContactSchema,
  branchInformationSchema,
} from "@/lib/validators/branch";
import { currencyOptions, timezoneOptions } from "@/config/onboarding";
import type { BranchSettingsSectionId } from "@/config/branches";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "coming-soon", label: "Coming soon" },
  { value: "temporarily-closed", label: "Temporarily closed" },
];

type SectionViewProps = {
  sectionId: BranchSettingsSectionId;
  title: string;
  description: string;
};

function NoBranchNotice() {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
      Select a branch from the hub to preview settings. Forms are UI-only.
    </p>
  );
}

export function BranchGeneralSettingsView() {
  const { currentBranch } = useBranch();

  return (
    <BranchSettingsPlaceholder
      sectionId="general"
      title="Branch · General"
      description="Branch identity, code, timezone, and status."
    >
      {!currentBranch ? (
        <NoBranchNotice />
      ) : (
        <Form
          schema={branchInformationSchema}
          defaultValues={{
            name: currentBranch.name,
            branchCode: currentBranch.branchCode,
            status: currentBranch.status,
            isMainBranch: currentBranch.isMainBranch,
            managerId: currentBranch.managerId ?? "",
            timezone: currentBranch.timezone,
            currency: currentBranch.currency,
          }}
          className="space-y-5"
        >
          {() => (
            <>
              <FormRow columns={2}>
                <TextField name="name" label="Branch name" required />
                <TextField name="branchCode" label="Branch code" required />
              </FormRow>
              <FormRow columns={2}>
                <SelectField
                  name="status"
                  label="Status"
                  options={statusOptions}
                  required
                />
                <TextField
                  name="managerId"
                  label="Manager ID"
                  description="Placeholder — no user binding"
                />
              </FormRow>
              <FormRow columns={2}>
                <SelectField
                  name="timezone"
                  label="Timezone"
                  options={timezoneOptions}
                  required
                />
                <SelectField
                  name="currency"
                  label="Currency"
                  options={currencyOptions}
                  required
                />
              </FormRow>
              <SwitchField name="isMainBranch" label="Main branch" />
            </>
          )}
        </Form>
      )}
    </BranchSettingsPlaceholder>
  );
}

export function BranchAddressSettingsView() {
  const { currentBranch } = useBranch();

  return (
    <BranchSettingsPlaceholder
      sectionId="address"
      title="Branch · Address"
      description="Location and postal details for the active branch."
    >
      {!currentBranch ? (
        <NoBranchNotice />
      ) : (
        <Form
          schema={branchAddressSchema}
          defaultValues={{
            address: currentBranch.address,
            city: currentBranch.city,
            state: currentBranch.state,
            country: currentBranch.country,
            postalCode: currentBranch.postalCode,
          }}
          className="space-y-5"
        >
          {() => (
            <>
              <TextField name="address" label="Address" required />
              <FormRow columns={2}>
                <TextField name="city" label="City" required />
                <TextField name="state" label="State" required />
              </FormRow>
              <FormRow columns={2}>
                <TextField name="country" label="Country" required />
                <TextField name="postalCode" label="Postal code" required />
              </FormRow>
            </>
          )}
        </Form>
      )}
    </BranchSettingsPlaceholder>
  );
}

export function BranchContactSettingsView() {
  const { currentBranch } = useBranch();

  return (
    <BranchSettingsPlaceholder
      sectionId="general"
      title="Branch · Contact"
      description="Contact information for the active branch."
    >
      {!currentBranch ? (
        <NoBranchNotice />
      ) : (
        <Form
          schema={branchContactSchema}
          defaultValues={{
            email: currentBranch.email,
            phone: currentBranch.phone,
          }}
          className="space-y-5"
        >
          {() => (
            <FormRow columns={2}>
              <EmailField name="email" label="Email" required />
              <PhoneField name="phone" label="Phone" required />
            </FormRow>
          )}
        </Form>
      )}
    </BranchSettingsPlaceholder>
  );
}

export function BranchBusinessHoursSettingsView() {
  const { currentBranch } = useBranch();

  return (
    <BranchSettingsPlaceholder
      sectionId="business-hours"
      title="Branch · Business Hours"
      description="Opening hours placeholder — not enforced."
    >
      {!currentBranch ? (
        <NoBranchNotice />
      ) : (
        <Form
          schema={branchBusinessHoursSchema}
          defaultValues={{
            timezone: currentBranch.openingHours?.timezone ?? currentBranch.timezone,
            days: currentBranch.openingHours?.days ?? [],
            notes: currentBranch.openingHours?.notes ?? "",
          }}
          className="space-y-5"
        >
          {() => (
            <>
              <SelectField
                name="timezone"
                label="Hours timezone"
                options={timezoneOptions}
              />
              <TextField
                name="notes"
                label="Notes"
                description="Business hours placeholder"
                placeholder="e.g. Closed on public holidays"
              />
              <p className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Day-by-day schedule UI arrives in a later module. Days in draft:{" "}
                {currentBranch.openingHours?.days?.length ?? 0}
              </p>
            </>
          )}
        </Form>
      )}
    </BranchSettingsPlaceholder>
  );
}

export function BranchBrandingSettingsView() {
  return (
    <BranchSettingsPlaceholder
      sectionId="branding"
      title="Branch · Branding"
      description="Branch-level branding placeholders."
    >
      <PlaceholderBlock
        title="Logo & colors"
        body="Upload and theme controls will live here. No branding save in this module."
      />
    </BranchSettingsPlaceholder>
  );
}

export function BranchTaxesSettingsView() {
  return (
    <BranchSettingsPlaceholder
      sectionId="taxes"
      title="Branch · Taxes"
      description="Tax configuration placeholder."
    >
      <PlaceholderBlock
        title="Tax profiles"
        body="GST / VAT rates and inclusive pricing toggles will be configured here."
      />
    </BranchSettingsPlaceholder>
  );
}

export function BranchReceiptSettingsView() {
  return (
    <BranchSettingsPlaceholder
      sectionId="receipt"
      title="Branch · Receipt"
      description="Receipt settings placeholder."
    >
      <PlaceholderBlock
        title="Receipt footer & logo"
        body="Receipt templates and footer text will be configured here."
      />
    </BranchSettingsPlaceholder>
  );
}

export function BranchDevicesSettingsView() {
  return (
    <BranchSettingsPlaceholder
      sectionId="devices"
      title="Branch · Devices"
      description="POS and device placeholders."
    >
      <PlaceholderBlock
        title="Registered devices"
        body="POS terminals, printers, and kitchen displays will appear here."
      />
    </BranchSettingsPlaceholder>
  );
}

function PlaceholderBlock({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

/** Unused export kept for typed section maps */
export type BranchSectionView = SectionViewProps;
