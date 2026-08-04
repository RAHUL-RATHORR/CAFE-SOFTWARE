"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import { vendorFailure, vendorSuccess, zodFieldErrors } from "@/lib/vendors";
import {
  createVendorSchema,
  deleteVendorSchema,
  searchVendorSchema,
  updateVendorSchema,
} from "@/lib/validators/vendor";
import { vendorRepository } from "@/repositories/vendor";
import { resolveVendorActor } from "@/actions/vendors/context";
import type {
  Vendor,
  VendorActionResult,
  VendorListResult,
  VendorSelectOption,
} from "@/types/vendor";

function mapDbError(error: unknown): VendorActionResult<never> {
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      return vendorFailure(
        "DUPLICATE_VENDOR",
        "A vendor with this phone or code already exists.",
        {
          phone: ["This phone number may already be in use."],
          vendorCode: ["This vendor code may already be in use."],
        }
      );
    }
    return vendorFailure("DATABASE_ERROR", error.message);
  }
  return vendorFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateVendorPaths(id?: string) {
  revalidatePath("/vendors");
  revalidatePath("/purchases");
  if (id) {
    revalidatePath(`/vendors/${id}`);
    revalidatePath(`/vendors/${id}/edit`);
  }
}

export async function createVendor(
  input: unknown
): Promise<VendorActionResult<Vendor>> {
  const actor = await resolveVendorActor(["vendors.create"]);
  if (!actor.success) return actor;

  const parsed = createVendorSchema.safeParse(input);
  if (!parsed.success) {
    return vendorFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;

  try {
    const existing = await vendorRepository.findByPhone(
      values.phone,
      actor.data.restaurantId
    );
    if (existing) {
      return vendorFailure(
        "DUPLICATE_VENDOR",
        "A vendor with this phone already exists.",
        { phone: ["This phone number is already in use."] }
      );
    }

    const vendor = await vendorRepository.create({
      restaurantId: actor.data.restaurantId,
      branchId: values.branchId ?? null,
      vendorCode: values.vendorCode || undefined,
      companyName: values.companyName,
      contactPerson: values.contactPerson ?? "",
      email: values.email ?? "",
      phone: values.phone,
      gstNumber: values.gstNumber ?? "",
      address: values.address ?? "",
      city: values.city ?? "",
      state: values.state ?? "",
      country: values.country ?? "",
      postalCode: values.postalCode ?? "",
      status: values.status,
      rating: values.rating,
      notes: values.notes ?? "",
      createdBy: actor.data.userId,
    });

    revalidateVendorPaths(vendor.id);
    return vendorSuccess(vendor);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateVendor(
  input: unknown
): Promise<VendorActionResult<Vendor>> {
  const actor = await resolveVendorActor(["vendors.edit"]);
  if (!actor.success) return actor;

  const parsed = updateVendorSchema.safeParse(input);
  if (!parsed.success) {
    return vendorFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;

  try {
    if (rest.phone) {
      const existing = await vendorRepository.findByPhone(
        rest.phone,
        actor.data.restaurantId,
        id
      );
      if (existing) {
        return vendorFailure(
          "DUPLICATE_VENDOR",
          "A vendor with this phone already exists.",
          { phone: ["This phone number is already in use."] }
        );
      }
    }

    const vendor = await vendorRepository.update(id, actor.data.restaurantId, {
      ...rest,
      updatedBy: actor.data.userId,
    });

    if (!vendor) {
      return vendorFailure("NOT_FOUND", "Vendor not found.");
    }

    revalidateVendorPaths(vendor.id);
    return vendorSuccess(vendor);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deleteVendor(
  input: unknown
): Promise<VendorActionResult<{ id: string }>> {
  const actor = await resolveVendorActor(["vendors.delete"]);
  if (!actor.success) return actor;

  const parsed = deleteVendorSchema.safeParse(input);
  if (!parsed.success) {
    return vendorFailure(
      "VALIDATION_ERROR",
      "Invalid vendor id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const vendor = await vendorRepository.softDelete(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!vendor) {
      return vendorFailure("NOT_FOUND", "Vendor not found.");
    }
    revalidateVendorPaths(vendor.id);
    return vendorSuccess({ id: vendor.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getVendors(
  input: unknown = {}
): Promise<VendorActionResult<VendorListResult>> {
  const actor = await resolveVendorActor(["vendors.view", "purchases.view"]);
  if (!actor.success) return actor;

  const parsed = searchVendorSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return vendorFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await vendorRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return vendorSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getVendorById(
  id: string
): Promise<VendorActionResult<Vendor>> {
  const actor = await resolveVendorActor(["vendors.view", "purchases.view"]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return vendorFailure("VALIDATION_ERROR", "Vendor id is required.");
  }

  try {
    const vendor = await vendorRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!vendor) {
      return vendorFailure("NOT_FOUND", "Vendor not found.");
    }
    return vendorSuccess(vendor);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getVendorOptions(): Promise<
  VendorActionResult<VendorSelectOption[]>
> {
  const actor = await resolveVendorActor([
    "vendors.view",
    "purchases.view",
    "purchases.create",
    "purchases.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const options = await vendorRepository.listOptions(
      actor.data.restaurantId
    );
    return vendorSuccess(options);
  } catch (error) {
    return mapDbError(error);
  }
}
