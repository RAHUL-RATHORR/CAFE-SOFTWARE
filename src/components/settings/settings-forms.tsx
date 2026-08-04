"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AppCard } from "@/components/cards/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DsBadge } from "@/components/badges/ds-badge";
import {
  updateBranchSettings,
  updateBrandSettings,
  updateDeviceSettings,
  updateInvoiceSettings,
  updateNotificationSettings,
  updatePrinterSettings,
  updateReceiptSettings,
  updateRestaurantSettings,
  updateSecuritySettings,
  updateSystemPreferences,
  updateTaxSettings,
} from "@/actions/settings";
import {
  DEVICE_TYPE_LABELS,
  PAPER_SIZE_LABELS,
  PRINT_LAYOUT_LABELS,
  PRINTER_CONNECTION_LABELS,
  PRINTER_ROLE_LABELS,
  ROUNDING_RULE_LABELS,
  TAX_MODE_LABELS,
} from "@/config/settings";
import { currencyOptions, timezoneOptions } from "@/config/onboarding";
import {
  updateBranchSettingsSchema,
  updateBrandSettingsSchema,
  updateDeviceSettingsSchema,
  updateInvoiceSettingsSchema,
  updateNotificationSettingsSchema,
  updatePrinterSettingsSchema,
  updateReceiptSettingsSchema,
  updateRestaurantSettingsSchema,
  updateSecuritySettingsSchema,
  updateSystemPreferencesSchema,
  updateTaxSettingsSchema,
} from "@/lib/validators/settings";
import { toast } from "@/store/toast-store";
import type {
  BrandSettings,
  BranchSettingsData,
  DeviceSettings,
  InvoiceSettings,
  NotificationSettings,
  PrinterSettings,
  ReceiptSettings,
  RestaurantSettings,
  SecuritySettings,
  SystemPreferencesSettings,
  TaxSettings,
} from "@/types/settings";
import type { ZodTypeAny } from "zod";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm";

type SaveHandler = (
  input: unknown
) => Promise<{ success: boolean; error?: { message: string } }>;

function useSettingsSave(action: SaveHandler) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function save(values: unknown, successMessage = "Settings saved") {
    startTransition(async () => {
      const result = await action(values);
      if (!result.success) {
        toast.error(result.error?.message ?? "Unable to save");
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  return { isPending, save };
}

function submitWithSchema(
  schema: ZodTypeAny,
  values: unknown,
  save: (values: unknown) => void
) {
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    toast.error(parsed.error.issues[0]?.message ?? "Invalid form values");
    return;
  }
  save(parsed.data);
}

export function RestaurantSettingsForm({
  settings,
  mode = "restaurant",
}: {
  settings: RestaurantSettings;
  mode?: "restaurant" | "business" | "currency";
}) {
  const { isPending, save } = useSettingsSave(updateRestaurantSettings);
  const form = useForm({ defaultValues: settings });

  return (
    <AppCard
      title={
        mode === "business"
          ? "Business details"
          : mode === "currency"
            ? "Currency & timezone"
            : "Restaurant profile"
      }
      description={
        mode === "business"
          ? "Legal identity and compliance identifiers"
          : mode === "currency"
            ? "Default currency, timezone, and language"
            : "Name, contact, hours, and status"
      }
      contentClassName="space-y-4"
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateRestaurantSettingsSchema, values, save)
        )}
      >
        {mode === "restaurant" || mode === "business" ? (
          <>
            <Field label="Restaurant name">
              <Input className="rounded-xl" {...form.register("restaurantName")} />
            </Field>
            <Field label="Legal name">
              <Input className="rounded-xl" {...form.register("legalName")} />
            </Field>
          </>
        ) : null}
        {mode === "business" ? (
          <>
            <Field label="GST number">
              <Input className="rounded-xl" {...form.register("gstNumber")} />
            </Field>
            <Field label="FSSAI number">
              <Input className="rounded-xl" {...form.register("fssaiNumber")} />
            </Field>
            <Field label="Business address">
              <Input className="rounded-xl" {...form.register("businessAddress")} />
            </Field>
            <Field label="Business status">
              <select className={inputClass} {...form.register("businessStatus")}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="temporarily-closed">Temporarily closed</option>
              </select>
            </Field>
          </>
        ) : null}
        {mode === "restaurant" ? (
          <>
            <Field label="Email">
              <Input className="rounded-xl" {...form.register("email")} />
            </Field>
            <Field label="Phone">
              <Input className="rounded-xl" {...form.register("phone")} />
            </Field>
            <Field label="Website">
              <Input className="rounded-xl" {...form.register("website")} />
            </Field>
            <Field label="Logo URL">
              <Input className="rounded-xl" {...form.register("logo")} />
            </Field>
            <Field label="Opening hours">
              <Input
                className="rounded-xl"
                placeholder="09:00"
                {...form.register("openingHours")}
              />
            </Field>
            <Field label="Closing hours">
              <Input
                className="rounded-xl"
                placeholder="22:00"
                {...form.register("closingHours")}
              />
            </Field>
          </>
        ) : null}
        {mode === "currency" ? (
          <>
            <Field label="Currency">
              <select className={inputClass} {...form.register("currency")}>
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Timezone">
              <select className={inputClass} {...form.register("timezone")}>
                {timezoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Language">
              <Input className="rounded-xl" {...form.register("language")} />
            </Field>
          </>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </AppCard>
  );
}

export function BranchSettingsForm({ settings }: { settings: BranchSettingsData }) {
  const { isPending, save } = useSettingsSave(updateBranchSettings);
  const form = useForm({
    defaultValues: { ...settings, branchId: settings.branchId },
  });

  return (
    <AppCard
      title="Branch settings"
      description="Outlet information, hours, and contact. Manager assignment is a placeholder."
      contentClassName="space-y-4"
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateBranchSettingsSchema, values, save)
        )}
      >
        <Field label="Branch name">
          <Input className="rounded-xl" {...form.register("branchName")} />
        </Field>
        <Field label="Status">
          <select className={inputClass} {...form.register("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <Field label="Address">
          <Input className="rounded-xl" {...form.register("address")} />
        </Field>
        <Field label="City">
          <Input className="rounded-xl" {...form.register("city")} />
        </Field>
        <Field label="State">
          <Input className="rounded-xl" {...form.register("state")} />
        </Field>
        <Field label="Country">
          <Input className="rounded-xl" {...form.register("country")} />
        </Field>
        <Field label="Postal code">
          <Input className="rounded-xl" {...form.register("postalCode")} />
        </Field>
        <Field label="Phone">
          <Input className="rounded-xl" {...form.register("phone")} />
        </Field>
        <Field label="Email">
          <Input className="rounded-xl" {...form.register("email")} />
        </Field>
        <Field label="Manager (placeholder)">
          <Input className="rounded-xl" {...form.register("managerName")} />
        </Field>
        <Field label="Working hours start">
          <Input className="rounded-xl" {...form.register("workingHoursStart")} />
        </Field>
        <Field label="Working hours end">
          <Input className="rounded-xl" {...form.register("workingHoursEnd")} />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={isPending}>
            {isPending ? "Saving…" : "Save branch settings"}
          </Button>
        </div>
      </form>
    </AppCard>
  );
}

export function TaxSettingsForm({ settings }: { settings: TaxSettings }) {
  const { isPending, save } = useSettingsSave(updateTaxSettings);
  const form = useForm({ defaultValues: settings });
  const profiles = form.watch("profiles") ?? settings.profiles;

  return (
    <AppCard
      title="Tax settings"
      description="GST / CGST / SGST / IGST profiles, VAT placeholder, service charge, and rounding."
      contentClassName="space-y-4"
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateTaxSettingsSchema, values, save)
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tax mode">
            <select className={inputClass} {...form.register("taxMode")}>
              {Object.entries(TAX_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rounding rule">
            <select className={inputClass} {...form.register("roundingRule")}>
              {Object.entries(ROUNDING_RULE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium">Tax profiles</p>
          {profiles.map((profile, index) => (
            <div
              key={profile.id}
              className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-3"
            >
              <input type="hidden" {...form.register(`profiles.${index}.id`)} />
              <Field label="Profile name">
                <Input className="rounded-xl" {...form.register(`profiles.${index}.name`)} />
              </Field>
              <Field label="GST %">
                <Input type="number" step="0.01" className="rounded-xl" {...form.register(`profiles.${index}.gstPercent`, { valueAsNumber: true })} />
              </Field>
              <Field label="CGST %">
                <Input type="number" step="0.01" className="rounded-xl" {...form.register(`profiles.${index}.cgstPercent`, { valueAsNumber: true })} />
              </Field>
              <Field label="SGST %">
                <Input type="number" step="0.01" className="rounded-xl" {...form.register(`profiles.${index}.sgstPercent`, { valueAsNumber: true })} />
              </Field>
              <Field label="IGST %">
                <Input type="number" step="0.01" className="rounded-xl" {...form.register(`profiles.${index}.igstPercent`, { valueAsNumber: true })} />
              </Field>
              <Field label="VAT % (placeholder)">
                <Input type="number" step="0.01" className="rounded-xl" {...form.register(`profiles.${index}.vatPercent`, { valueAsNumber: true })} />
              </Field>
              <Field label="Service charge %">
                <Input type="number" step="0.01" className="rounded-xl" {...form.register(`profiles.${index}.serviceChargePercent`, { valueAsNumber: true })} />
              </Field>
            </div>
          ))}
        </div>
        <Button type="submit" className="rounded-xl" disabled={isPending}>
          {isPending ? "Saving…" : "Save tax settings"}
        </Button>
      </form>
    </AppCard>
  );
}

export function ReceiptSettingsForm({ settings }: { settings: ReceiptSettings }) {
  const { isPending, save } = useSettingsSave(updateReceiptSettings);
  const form = useForm({ defaultValues: settings });

  return (
    <AppCard
      title="Receipt settings"
      description="Header, footer, prefixes, layout, and paper size. QR / barcode are placeholders."
      contentClassName="space-y-4"
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateReceiptSettingsSchema, values, save)
        )}
      >
        <Field label="Header"><Input className="rounded-xl" {...form.register("header")} /></Field>
        <Field label="Footer"><Input className="rounded-xl" {...form.register("footer")} /></Field>
        <Field label="Logo URL"><Input className="rounded-xl" {...form.register("logo")} /></Field>
        <Field label="Receipt prefix"><Input className="rounded-xl" {...form.register("receiptPrefix")} /></Field>
        <Field label="Invoice prefix"><Input className="rounded-xl" {...form.register("invoicePrefix")} /></Field>
        <Field label="Paper size">
          <select className={inputClass} {...form.register("paperSize")}>
            {Object.entries(PAPER_SIZE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Print layout">
          <select className={inputClass} {...form.register("printLayout")}>
            {Object.entries(PRINT_LAYOUT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Receipt notes"><Input className="rounded-xl" {...form.register("receiptNotes")} /></Field>
        <Field label="Terms & conditions"><Input className="rounded-xl" {...form.register("termsAndConditions")} /></Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" {...form.register("qrEnabled")} /> QR code (placeholder)
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" {...form.register("barcodeEnabled")} /> Barcode (placeholder)
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={isPending}>
            {isPending ? "Saving…" : "Save receipt settings"}
          </Button>
        </div>
      </form>
    </AppCard>
  );
}

export function InvoiceSettingsForm({ settings }: { settings: InvoiceSettings }) {
  const { isPending, save } = useSettingsSave(updateInvoiceSettings);
  const form = useForm({ defaultValues: settings });

  return (
    <AppCard title="Invoice settings" description="Prefix, auto numbering, notes, and footer" contentClassName="space-y-4">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateInvoiceSettingsSchema, values, save)
        )}
      >
        <Field label="Invoice prefix"><Input className="rounded-xl" {...form.register("invoicePrefix")} /></Field>
        <Field label="Next invoice number">
          <Input type="number" className="rounded-xl" {...form.register("nextInvoiceNumber", { valueAsNumber: true })} />
        </Field>
        <Field label="Invoice notes"><Input className="rounded-xl" {...form.register("invoiceNotes")} /></Field>
        <Field label="Default terms"><Input className="rounded-xl" {...form.register("defaultTerms")} /></Field>
        <Field label="Invoice footer"><Input className="rounded-xl" {...form.register("invoiceFooter")} /></Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" {...form.register("autoNumbering")} /> Auto numbering
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={isPending}>
            {isPending ? "Saving…" : "Save invoice settings"}
          </Button>
        </div>
      </form>
    </AppCard>
  );
}

export function PrinterSettingsForm({ settings }: { settings: PrinterSettings }) {
  const { isPending, save } = useSettingsSave(updatePrinterSettings);
  const form = useForm({ defaultValues: settings });
  const printers = form.watch("printers") ?? settings.printers;

  return (
    <AppCard
      title="Printer foundation"
      description="Kitchen, billing, receipt, and label printers. No hardware SDKs — network/USB/Bluetooth are placeholders."
      contentClassName="space-y-4"
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updatePrinterSettingsSchema, values, save)
        )}
      >
        {printers.map((printer, index) => (
          <div key={printer.id} className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-2">
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <p className="font-medium">{printer.name}</p>
              <DsBadge variant="secondary" size="sm">{PRINTER_ROLE_LABELS[printer.role]}</DsBadge>
            </div>
            <input type="hidden" {...form.register(`printers.${index}.id`)} />
            <input type="hidden" {...form.register(`printers.${index}.role`)} />
            <Field label="Name"><Input className="rounded-xl" {...form.register(`printers.${index}.name`)} /></Field>
            <Field label="Connection">
              <select className={inputClass} {...form.register(`printers.${index}.connectionType`)}>
                {Object.entries(PRINTER_CONNECTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Address (placeholder)"><Input className="rounded-xl" {...form.register(`printers.${index}.address`)} /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register(`printers.${index}.enabled`)} /> Enabled
            </label>
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("printQueueEnabled")} /> Print queue (placeholder)
        </label>
        <Button type="submit" className="rounded-xl" disabled={isPending}>
          {isPending ? "Saving…" : "Save printer settings"}
        </Button>
      </form>
    </AppCard>
  );
}

export function DeviceSettingsForm({ settings }: { settings: DeviceSettings }) {
  const { isPending, save } = useSettingsSave(updateDeviceSettings);
  const form = useForm({ defaultValues: settings });
  const devices = form.watch("devices") ?? settings.devices;

  return (
    <AppCard
      title="Device foundation"
      description="POS, KDS, tablet, mobile, desktop. Scanner, cash drawer, and customer display are placeholders."
      contentClassName="space-y-4"
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateDeviceSettingsSchema, values, save)
        )}
      >
        {devices.map((device, index) => (
          <div key={device.id} className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-2">
            <input type="hidden" {...form.register(`devices.${index}.id`)} />
            <Field label="Name"><Input className="rounded-xl" {...form.register(`devices.${index}.name`)} /></Field>
            <Field label="Type">
              <select className={inputClass} {...form.register(`devices.${index}.type`)}>
                {Object.entries(DEVICE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputClass} {...form.register(`devices.${index}.status`)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="offline">Offline</option>
              </select>
            </Field>
            <Field label="Identifier (placeholder)"><Input className="rounded-xl" {...form.register(`devices.${index}.identifier`)} /></Field>
            <Field label="Notes"><Input className="rounded-xl" {...form.register(`devices.${index}.notes`)} /></Field>
          </div>
        ))}
        <Button type="submit" className="rounded-xl" disabled={isPending}>
          {isPending ? "Saving…" : "Save device settings"}
        </Button>
      </form>
    </AppCard>
  );
}

export function NotificationSettingsForm({ settings }: { settings: NotificationSettings }) {
  const { isPending, save } = useSettingsSave(updateNotificationSettings);
  const form = useForm({ defaultValues: settings });
  const toggles = [
    { key: "orderNotifications" as const, label: "Order notifications" },
    { key: "kitchenAlerts" as const, label: "Kitchen alerts" },
    { key: "billingAlerts" as const, label: "Billing alerts" },
    { key: "inventoryAlerts" as const, label: "Inventory alerts" },
    { key: "purchaseAlerts" as const, label: "Purchase alerts" },
    { key: "systemAlerts" as const, label: "System alerts" },
    { key: "emailEnabled" as const, label: "Email", hint: "Placeholder" },
    { key: "smsEnabled" as const, label: "SMS", hint: "Placeholder" },
    { key: "pushEnabled" as const, label: "Push", hint: "Placeholder" },
  ];

  return (
    <AppCard title="Notification settings" description="Operational alert categories for this restaurant" contentClassName="space-y-4">
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateNotificationSettingsSchema, values, save)
        )}
      >
        {toggles.map((item) => (
          <label key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2 text-sm">
            <span>
              {item.label}
              {item.hint ? <span className="ml-2 text-xs text-muted-foreground">{item.hint}</span> : null}
            </span>
            <input type="checkbox" {...form.register(item.key)} />
          </label>
        ))}
        <Button type="submit" className="rounded-xl" disabled={isPending}>
          {isPending ? "Saving…" : "Save notification settings"}
        </Button>
      </form>
    </AppCard>
  );
}

export function SecuritySettingsForm({ settings }: { settings: SecuritySettings }) {
  const { isPending, save } = useSettingsSave(updateSecuritySettings);
  const form = useForm({ defaultValues: settings });

  return (
    <AppCard
      title="Security settings"
      description="Password policy, session timeout, and login security. MFA / devices / IP are placeholders."
      contentClassName="space-y-4"
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateSecuritySettingsSchema, values, save)
        )}
      >
        <Field label="Min password length">
          <Input type="number" className="rounded-xl" {...form.register("minPasswordLength", { valueAsNumber: true })} />
        </Field>
        <Field label="Session timeout (minutes)">
          <Input type="number" className="rounded-xl" {...form.register("sessionTimeoutMinutes", { valueAsNumber: true })} />
        </Field>
        <Field label="Max login attempts">
          <Input type="number" className="rounded-xl" {...form.register("maxLoginAttempts", { valueAsNumber: true })} />
        </Field>
        <Field label="Lockout (minutes)">
          <Input type="number" className="rounded-xl" {...form.register("lockoutMinutes", { valueAsNumber: true })} />
        </Field>
        {(
          [
            ["requireUppercase", "Require uppercase"],
            ["requireNumber", "Require number"],
            ["requireSpecialChar", "Require special character"],
            ["mfaEnabled", "MFA (placeholder)"],
            ["allowedDevicesEnabled", "Allowed devices (placeholder)"],
            ["ipRestrictionEnabled", "IP restriction (placeholder)"],
            ["auditLoginEvents", "Audit login events"],
            ["auditSettingsChanges", "Audit settings changes"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register(key)} />
            {label}
          </label>
        ))}
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={isPending}>
            {isPending ? "Saving…" : "Save security settings"}
          </Button>
        </div>
      </form>
    </AppCard>
  );
}

export function BrandSettingsForm({ settings }: { settings: BrandSettings }) {
  const { isPending, save } = useSettingsSave(updateBrandSettings);
  const form = useForm({ defaultValues: settings });

  return (
    <AppCard
      title="Branding"
      description="Primary/secondary colors, logos, and brand theme. Email branding is a placeholder."
      contentClassName="space-y-4"
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateBrandSettingsSchema, values, save)
        )}
      >
        <Field label="Primary color"><Input className="rounded-xl" {...form.register("primaryColor")} /></Field>
        <Field label="Secondary color"><Input className="rounded-xl" {...form.register("secondaryColor")} /></Field>
        <Field label="Logo URL"><Input className="rounded-xl" {...form.register("logo")} /></Field>
        <Field label="Favicon URL"><Input className="rounded-xl" {...form.register("favicon")} /></Field>
        <Field label="Theme">
          <select className={inputClass} {...form.register("theme")}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="brand">Brand</option>
          </select>
        </Field>
        {(
          [
            ["receiptBranding", "Receipt branding"],
            ["invoiceBranding", "Invoice branding"],
            ["emailBranding", "Email branding (placeholder)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register(key)} />
            {label}
          </label>
        ))}
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={isPending}>
            {isPending ? "Saving…" : "Save branding"}
          </Button>
        </div>
      </form>
    </AppCard>
  );
}

export function SystemPreferencesForm({ settings }: { settings: SystemPreferencesSettings }) {
  const { isPending, save } = useSettingsSave(updateSystemPreferences);
  const form = useForm({
    defaultValues: { ...settings, defaultBranchId: settings.defaultBranchId },
  });

  return (
    <AppCard
      title="System preferences"
      description="Restaurant-wide formats, theme, pagination, and default timezone"
      contentClassName="space-y-4"
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) =>
          submitWithSchema(updateSystemPreferencesSchema, values, save)
        )}
      >
        <Field label="Date format"><Input className="rounded-xl" {...form.register("dateFormat")} /></Field>
        <Field label="Time format">
          <select className={inputClass} {...form.register("timeFormat")}>
            <option value="12h">12-hour</option>
            <option value="24h">24-hour</option>
          </select>
        </Field>
        <Field label="Currency format"><Input className="rounded-xl" {...form.register("currencyFormat")} /></Field>
        <Field label="Number format"><Input className="rounded-xl" {...form.register("numberFormat")} /></Field>
        <Field label="Default language"><Input className="rounded-xl" {...form.register("defaultLanguage")} /></Field>
        <Field label="Pagination size">
          <Input type="number" className="rounded-xl" {...form.register("paginationSize", { valueAsNumber: true })} />
        </Field>
        <Field label="Timezone">
          <select className={inputClass} {...form.register("timezone")}>
            {timezoneOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Theme">
          <select className={inputClass} {...form.register("theme")}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="brand">Brand</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={isPending}>
            {isPending ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </form>
    </AppCard>
  );
}
