import {
  connectToDatabase,
  handleDatabaseError,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import {
  defaultBranchSettings,
  defaultBrandSettings,
  defaultDeviceSettings,
  defaultInvoiceSettings,
  defaultNotificationSettings,
  defaultPrinterSettings,
  defaultReceiptSettings,
  defaultRestaurantSettings,
  defaultSecuritySettings,
  defaultSystemPreferences,
  defaultTaxSettings,
} from "@/config/settings";
import {
  serializeBranchSettings,
  serializeBrandSettings,
  serializeDeviceSettings,
  serializeInvoiceSettings,
  serializeNotificationSettings,
  serializePrinterSettings,
  serializeReceiptSettings,
  serializeRestaurantSettings,
  serializeSecuritySettings,
  serializeSystemPreferences,
  serializeTaxSettings,
} from "@/lib/settings/serializers";
import {
  BrandSettingsModel,
  BranchSettingsModel,
  DeviceSettingsModel,
  InvoiceSettingsModel,
  NotificationSettingsModel,
  PrinterSettingsModel,
  ReceiptSettingsModel,
  RestaurantSettingsModel,
  SecuritySettingsModel,
  SystemPreferencesModel,
  TaxSettingsModel,
} from "@/models/settings";
import { RestaurantModel } from "@/models/restaurant";
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
  SystemPreferencesSettings,
  TaxSettings,
} from "@/types/settings";
import type {
  UpdateBranchSettingsInput,
  UpdateBrandSettingsInput,
  UpdateDeviceSettingsInput,
  UpdateInvoiceSettingsInput,
  UpdateNotificationSettingsInput,
  UpdatePrinterSettingsInput,
  UpdateReceiptSettingsInput,
  UpdateRestaurantSettingsInput,
  UpdateSecuritySettingsInput,
  UpdateSystemPreferencesInput,
  UpdateTaxSettingsInput,
} from "@/lib/validators/settings";

type Filter = Record<string, unknown>;

function restaurantFilter(restaurantId: string): Filter {
  return notDeletedFilter({ restaurantId: toObjectId(restaurantId) });
}

function optionalRef(id: string | null | undefined) {
  if (!id || !isValidObjectId(id)) return null;
  return toObjectId(id);
}

async function seedFromRestaurant(restaurantId: string) {
  if (!isValidObjectId(restaurantId)) return defaultRestaurantSettings(restaurantId);
  const restaurant = await RestaurantModel.findById(restaurantId).lean();
  const base = defaultRestaurantSettings(restaurantId);
  if (!restaurant) return base;
  return {
    ...base,
    restaurantName: restaurant.name ?? "",
    logo: restaurant.logo ?? "",
    email: restaurant.email ?? "",
    phone: restaurant.phone ?? "",
    businessAddress: [restaurant.address, restaurant.city, restaurant.state, restaurant.country]
      .filter(Boolean)
      .join(", "),
    currency: restaurant.currency ?? "INR",
    timezone: restaurant.timezone ?? "Asia/Kolkata",
  };
}

async function getOrCreateRestaurant(
  restaurantId: string
): Promise<RestaurantSettings> {
  await connectToDatabase();
  let doc = await RestaurantSettingsModel.findOne(restaurantFilter(restaurantId));
  if (!doc) {
    const seed = await seedFromRestaurant(restaurantId);
    doc = await RestaurantSettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeRestaurantSettings(doc);
}

async function getOrCreateBranch(
  restaurantId: string
): Promise<BranchSettingsData> {
  await connectToDatabase();
  let doc = await BranchSettingsModel.findOne(restaurantFilter(restaurantId));
  if (!doc) {
    const seed = defaultBranchSettings(restaurantId);
    doc = await BranchSettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeBranchSettings(doc);
}

async function getOrCreateTax(restaurantId: string): Promise<TaxSettings> {
  await connectToDatabase();
  let doc = await TaxSettingsModel.findOne(restaurantFilter(restaurantId));
  if (!doc) {
    const seed = defaultTaxSettings(restaurantId);
    doc = await TaxSettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeTaxSettings(doc);
}

async function getOrCreateReceipt(
  restaurantId: string
): Promise<ReceiptSettings> {
  await connectToDatabase();
  let doc = await ReceiptSettingsModel.findOne(restaurantFilter(restaurantId));
  if (!doc) {
    const seed = defaultReceiptSettings(restaurantId);
    doc = await ReceiptSettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeReceiptSettings(doc);
}

async function getOrCreateInvoice(
  restaurantId: string
): Promise<InvoiceSettings> {
  await connectToDatabase();
  let doc = await InvoiceSettingsModel.findOne(restaurantFilter(restaurantId));
  if (!doc) {
    const seed = defaultInvoiceSettings(restaurantId);
    doc = await InvoiceSettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeInvoiceSettings(doc);
}

async function getOrCreatePrinters(
  restaurantId: string
): Promise<PrinterSettings> {
  await connectToDatabase();
  let doc = await PrinterSettingsModel.findOne(restaurantFilter(restaurantId));
  if (!doc) {
    const seed = defaultPrinterSettings(restaurantId);
    doc = await PrinterSettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializePrinterSettings(doc);
}

async function getOrCreateDevices(
  restaurantId: string
): Promise<DeviceSettings> {
  await connectToDatabase();
  let doc = await DeviceSettingsModel.findOne(restaurantFilter(restaurantId));
  if (!doc) {
    const seed = defaultDeviceSettings(restaurantId);
    doc = await DeviceSettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeDeviceSettings(doc);
}

async function getOrCreateNotifications(
  restaurantId: string
): Promise<NotificationSettings> {
  await connectToDatabase();
  let doc = await NotificationSettingsModel.findOne(
    restaurantFilter(restaurantId)
  );
  if (!doc) {
    const seed = defaultNotificationSettings(restaurantId);
    doc = await NotificationSettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeNotificationSettings(doc);
}

async function getOrCreateBrand(restaurantId: string): Promise<BrandSettings> {
  await connectToDatabase();
  let doc = await BrandSettingsModel.findOne(restaurantFilter(restaurantId));
  if (!doc) {
    const seed = defaultBrandSettings(restaurantId);
    doc = await BrandSettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeBrandSettings(doc);
}

async function getOrCreateSecurity(
  restaurantId: string
): Promise<SecuritySettings> {
  await connectToDatabase();
  let doc = await SecuritySettingsModel.findOne(restaurantFilter(restaurantId));
  if (!doc) {
    const seed = defaultSecuritySettings(restaurantId);
    doc = await SecuritySettingsModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeSecuritySettings(doc);
}

async function getOrCreatePreferences(
  restaurantId: string
): Promise<SystemPreferencesSettings> {
  await connectToDatabase();
  let doc = await SystemPreferencesModel.findOne(
    restaurantFilter(restaurantId)
  );
  if (!doc) {
    const seed = defaultSystemPreferences(restaurantId);
    doc = await SystemPreferencesModel.create({
      ...seed,
      restaurantId: toObjectId(restaurantId),
    });
  }
  return serializeSystemPreferences(doc);
}

async function getSettings(
  restaurantId: string
): Promise<GlobalSettingsBundle> {
  try {
    await connectToDatabase();
    const [
      restaurant,
      branch,
      tax,
      receipt,
      invoice,
      printers,
      devices,
      notifications,
      branding,
      security,
      preferences,
    ] = await Promise.all([
      getOrCreateRestaurant(restaurantId),
      getOrCreateBranch(restaurantId),
      getOrCreateTax(restaurantId),
      getOrCreateReceipt(restaurantId),
      getOrCreateInvoice(restaurantId),
      getOrCreatePrinters(restaurantId),
      getOrCreateDevices(restaurantId),
      getOrCreateNotifications(restaurantId),
      getOrCreateBrand(restaurantId),
      getOrCreateSecurity(restaurantId),
      getOrCreatePreferences(restaurantId),
    ]);
    return {
      restaurant,
      branch,
      tax,
      receipt,
      invoice,
      printers,
      devices,
      notifications,
      branding,
      security,
      preferences,
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to load settings");
  }
}

async function updateRestaurantSettings(
  restaurantId: string,
  input: UpdateRestaurantSettingsInput,
  updatedBy?: string | null
): Promise<RestaurantSettings> {
  try {
    await getOrCreateRestaurant(restaurantId);
    const $set: Filter = { ...input };
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await RestaurantSettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );

    // Keep Restaurant identity fields in sync when present
    const restaurantPatch: Filter = {};
    if (input.restaurantName !== undefined) {
      restaurantPatch.name = input.restaurantName;
    }
    if (input.logo !== undefined) restaurantPatch.logo = input.logo;
    if (input.email !== undefined) restaurantPatch.email = input.email;
    if (input.phone !== undefined) restaurantPatch.phone = input.phone;
    if (input.currency !== undefined) restaurantPatch.currency = input.currency;
    if (input.timezone !== undefined) restaurantPatch.timezone = input.timezone;
    if (Object.keys(restaurantPatch).length && isValidObjectId(restaurantId)) {
      await RestaurantModel.findByIdAndUpdate(restaurantId, {
        $set: restaurantPatch,
      });
    }

    return serializeRestaurantSettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update restaurant settings");
  }
}

async function updateBranchSettings(
  restaurantId: string,
  input: UpdateBranchSettingsInput,
  updatedBy?: string | null
): Promise<BranchSettingsData> {
  try {
    await getOrCreateBranch(restaurantId);
    const $set: Filter = { ...input };
    if (input.branchId !== undefined) {
      $set.branchId = optionalRef(input.branchId);
    }
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await BranchSettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializeBranchSettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update branch settings");
  }
}

async function updateTaxSettings(
  restaurantId: string,
  input: UpdateTaxSettingsInput,
  updatedBy?: string | null
): Promise<TaxSettings> {
  try {
    await getOrCreateTax(restaurantId);
    const $set: Filter = { ...input };
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await TaxSettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializeTaxSettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update tax settings");
  }
}

async function updateReceiptSettings(
  restaurantId: string,
  input: UpdateReceiptSettingsInput,
  updatedBy?: string | null
): Promise<ReceiptSettings> {
  try {
    await getOrCreateReceipt(restaurantId);
    const $set: Filter = { ...input };
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await ReceiptSettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializeReceiptSettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update receipt settings");
  }
}

async function updateInvoiceSettings(
  restaurantId: string,
  input: UpdateInvoiceSettingsInput,
  updatedBy?: string | null
): Promise<InvoiceSettings> {
  try {
    await getOrCreateInvoice(restaurantId);
    const $set: Filter = { ...input };
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await InvoiceSettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializeInvoiceSettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update invoice settings");
  }
}

async function updatePrinterSettings(
  restaurantId: string,
  input: UpdatePrinterSettingsInput,
  updatedBy?: string | null
): Promise<PrinterSettings> {
  try {
    await getOrCreatePrinters(restaurantId);
    const $set: Filter = { ...input };
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await PrinterSettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializePrinterSettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update printer settings");
  }
}

async function updateDeviceSettings(
  restaurantId: string,
  input: UpdateDeviceSettingsInput,
  updatedBy?: string | null
): Promise<DeviceSettings> {
  try {
    await getOrCreateDevices(restaurantId);
    const $set: Filter = { ...input };
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await DeviceSettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializeDeviceSettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update device settings");
  }
}

async function updateNotificationSettings(
  restaurantId: string,
  input: UpdateNotificationSettingsInput,
  updatedBy?: string | null
): Promise<NotificationSettings> {
  try {
    await getOrCreateNotifications(restaurantId);
    const $set: Filter = { ...input };
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await NotificationSettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializeNotificationSettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update notification settings");
  }
}

async function updateBrandSettings(
  restaurantId: string,
  input: UpdateBrandSettingsInput,
  updatedBy?: string | null
): Promise<BrandSettings> {
  try {
    await getOrCreateBrand(restaurantId);
    const $set: Filter = { ...input };
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await BrandSettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializeBrandSettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update brand settings");
  }
}

async function updateSecuritySettings(
  restaurantId: string,
  input: UpdateSecuritySettingsInput,
  updatedBy?: string | null
): Promise<SecuritySettings> {
  try {
    await getOrCreateSecurity(restaurantId);
    const $set: Filter = { ...input };
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await SecuritySettingsModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializeSecuritySettings(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update security settings");
  }
}

async function updateSystemPreferences(
  restaurantId: string,
  input: UpdateSystemPreferencesInput,
  updatedBy?: string | null
): Promise<SystemPreferencesSettings> {
  try {
    await getOrCreatePreferences(restaurantId);
    const $set: Filter = { ...input };
    if (input.defaultBranchId !== undefined) {
      $set.defaultBranchId = optionalRef(input.defaultBranchId);
    }
    if (updatedBy && isValidObjectId(updatedBy)) {
      $set.updatedBy = toObjectId(updatedBy);
    }
    const doc = await SystemPreferencesModel.findOneAndUpdate(
      restaurantFilter(restaurantId),
      { $set },
      { new: true }
    );
    return serializeSystemPreferences(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update system preferences");
  }
}

export const settingsRepository = {
  getSettings,
  getOrCreateRestaurant,
  getOrCreateBranch,
  getOrCreateTax,
  getOrCreateReceipt,
  getOrCreateInvoice,
  getOrCreatePrinters,
  getOrCreateDevices,
  getOrCreateNotifications,
  getOrCreateBrand,
  getOrCreateSecurity,
  getOrCreatePreferences,
  updateRestaurantSettings,
  updateBranchSettings,
  updateTaxSettings,
  updateReceiptSettings,
  updateInvoiceSettings,
  updatePrinterSettings,
  updateDeviceSettings,
  updateNotificationSettings,
  updateBrandSettings,
  updateSecuritySettings,
  updateSystemPreferences,
};
