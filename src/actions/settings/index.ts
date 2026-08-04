"use server";

import { revalidatePath } from "next/cache";
import { resolveSettingsActor } from "@/actions/settings/context";
import {
  settingsFailure,
  settingsSuccess,
  zodFieldErrors,
} from "@/lib/settings";
import { settingsRepository } from "@/repositories/settings";
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
import type {
  BrandSettings,
  BranchSettingsData,
  DeviceSettings,
  GlobalSettingsBundle,
  InvoiceSettings,
  NotificationSettings,
  PrinterSettings,
  ReceiptSettings,
  RestaurantSettings,
  SecuritySettings,
  SettingsActionResult,
  SystemPreferencesSettings,
  TaxSettings,
} from "@/types/settings";

function revalidateSettings(paths: string[] = []) {
  revalidatePath("/settings");
  for (const path of paths) revalidatePath(path);
}

export async function getSettings(): Promise<
  SettingsActionResult<GlobalSettingsBundle>
> {
  const actor = await resolveSettingsActor([
    "settings.view",
    "settings.update",
    "settings.edit",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const data = await settingsRepository.getSettings(actor.data.restaurantId);
    return settingsSuccess(data);
  } catch {
    return settingsFailure("DATABASE_ERROR", "Unable to load settings.");
  }
}

export async function updateRestaurantSettings(
  input: unknown
): Promise<SettingsActionResult<RestaurantSettings>> {
  const actor = await resolveSettingsActor([
    "settings.update",
    "settings.edit",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateRestaurantSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid restaurant settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateRestaurantSettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/restaurant", "/settings/business", "/settings/currency"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update restaurant settings."
    );
  }
}

export async function updateBranchSettings(
  input: unknown
): Promise<SettingsActionResult<BranchSettingsData>> {
  const actor = await resolveSettingsActor([
    "settings.update",
    "settings.edit",
    "settings.manage",
    "branches.edit",
  ]);
  if (!actor.success) return actor;

  const parsed = updateBranchSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid branch settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateBranchSettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/branches"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update branch settings."
    );
  }
}

export async function updateTaxSettings(
  input: unknown
): Promise<SettingsActionResult<TaxSettings>> {
  const actor = await resolveSettingsActor([
    "settings.update",
    "settings.edit",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateTaxSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid tax settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateTaxSettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/tax"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure("DATABASE_ERROR", "Unable to update tax settings.");
  }
}

export async function updateReceiptSettings(
  input: unknown
): Promise<SettingsActionResult<ReceiptSettings>> {
  const actor = await resolveSettingsActor([
    "settings.update",
    "settings.edit",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateReceiptSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid receipt settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateReceiptSettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/receipt"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update receipt settings."
    );
  }
}

export async function updateInvoiceSettings(
  input: unknown
): Promise<SettingsActionResult<InvoiceSettings>> {
  const actor = await resolveSettingsActor([
    "settings.update",
    "settings.edit",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateInvoiceSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid invoice settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateInvoiceSettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/invoice"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update invoice settings."
    );
  }
}

export async function updatePrinterSettings(
  input: unknown
): Promise<SettingsActionResult<PrinterSettings>> {
  const actor = await resolveSettingsActor([
    "settings.printers",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updatePrinterSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid printer settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updatePrinterSettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/printers"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update printer settings."
    );
  }
}

export async function updateDeviceSettings(
  input: unknown
): Promise<SettingsActionResult<DeviceSettings>> {
  const actor = await resolveSettingsActor([
    "settings.devices",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateDeviceSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid device settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateDeviceSettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/devices"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update device settings."
    );
  }
}

export async function updateNotificationSettings(
  input: unknown
): Promise<SettingsActionResult<NotificationSettings>> {
  const actor = await resolveSettingsActor([
    "settings.update",
    "settings.edit",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateNotificationSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid notification settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateNotificationSettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/notifications"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update notification settings."
    );
  }
}

export async function updateBrandSettings(
  input: unknown
): Promise<SettingsActionResult<BrandSettings>> {
  const actor = await resolveSettingsActor([
    "settings.branding",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateBrandSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid brand settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateBrandSettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/branding"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update brand settings."
    );
  }
}

export async function updateSecuritySettings(
  input: unknown
): Promise<SettingsActionResult<SecuritySettings>> {
  const actor = await resolveSettingsActor([
    "settings.security",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateSecuritySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid security settings.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateSecuritySettings(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/security"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update security settings."
    );
  }
}

export async function updateSystemPreferences(
  input: unknown
): Promise<SettingsActionResult<SystemPreferencesSettings>> {
  const actor = await resolveSettingsActor([
    "settings.update",
    "settings.edit",
    "settings.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateSystemPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return settingsFailure(
      "VALIDATION_ERROR",
      "Invalid system preferences.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await settingsRepository.updateSystemPreferences(
      actor.data.restaurantId,
      parsed.data,
      actor.data.userId
    );
    revalidateSettings(["/settings/preferences"]);
    return settingsSuccess(data);
  } catch {
    return settingsFailure(
      "DATABASE_ERROR",
      "Unable to update system preferences."
    );
  }
}
