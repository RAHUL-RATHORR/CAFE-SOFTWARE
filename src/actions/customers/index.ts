"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  customerFailure,
  customerSuccess,
  zodFieldErrors,
} from "@/lib/customers";
import {
  addCustomerNoteSchema,
  createCustomerSchema,
  deleteCustomerSchema,
  searchCustomerSchema,
  updateCustomerSchema,
  updateCustomerStatusSchema,
} from "@/lib/validators/customer";
import { customerRepository } from "@/repositories/customer";
import { resolveCustomerActor } from "@/actions/customers/context";
import type {
  Customer,
  CustomerActionResult,
  CustomerListResult,
  CustomerProfile,
  CustomerSelectOption,
} from "@/types/customer";

function mapDbError(error: unknown): CustomerActionResult<never> {
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      return customerFailure(
        "DUPLICATE_CUSTOMER",
        "A customer with this phone or code already exists.",
        {
          phone: ["This phone number may already be in use."],
          customerCode: ["This customer code may already be in use."],
        }
      );
    }
    return customerFailure("DATABASE_ERROR", error.message);
  }
  return customerFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateCustomerPaths(id?: string) {
  revalidatePath("/customers");
  if (id) {
    revalidatePath(`/customers/${id}`);
    revalidatePath(`/customers/${id}/edit`);
  }
}

export async function createCustomer(
  input: unknown
): Promise<CustomerActionResult<Customer>> {
  const actor = await resolveCustomerActor([
    "customers.create",
    "customers.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = createCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return customerFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;

  try {
    const existing = await customerRepository.findByPhone(
      values.phone,
      actor.data.restaurantId
    );
    if (existing) {
      return customerFailure(
        "DUPLICATE_CUSTOMER",
        "A customer with this phone already exists.",
        { phone: ["This phone number is already in use."] }
      );
    }

    const customer = await customerRepository.create({
      restaurantId: actor.data.restaurantId,
      branchId: values.branchId ?? null,
      customerCode: values.customerCode || undefined,
      firstName: values.firstName,
      lastName: values.lastName ?? "",
      email: values.email ?? "",
      phone: values.phone,
      dateOfBirth: values.dateOfBirth ?? null,
      anniversary: values.anniversary ?? null,
      gender: values.gender ?? null,
      avatar: values.avatar ?? "",
      addresses: values.addresses,
      tags: values.tags,
      notes: values.notes ?? "",
      preferredOrderType: values.preferredOrderType,
      preferredTable: values.preferredTable ?? null,
      status: values.status,
      loyaltyPoints: values.loyaltyPoints,
      createdBy: actor.data.userId,
    });

    revalidateCustomerPaths(customer.id);
    return customerSuccess(customer);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateCustomer(
  input: unknown
): Promise<CustomerActionResult<Customer>> {
  const actor = await resolveCustomerActor([
    "customers.edit",
    "customers.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return customerFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;

  try {
    if (rest.phone) {
      const existing = await customerRepository.findByPhone(
        rest.phone,
        actor.data.restaurantId,
        id
      );
      if (existing) {
        return customerFailure(
          "DUPLICATE_CUSTOMER",
          "A customer with this phone already exists.",
          { phone: ["This phone number is already in use."] }
        );
      }
    }

    const customer = await customerRepository.update(
      id,
      actor.data.restaurantId,
      {
        ...rest,
        updatedBy: actor.data.userId,
      }
    );

    if (!customer) {
      return customerFailure("NOT_FOUND", "Customer not found.");
    }

    revalidateCustomerPaths(customer.id);
    return customerSuccess(customer);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deleteCustomer(
  input: unknown
): Promise<CustomerActionResult<{ id: string }>> {
  const actor = await resolveCustomerActor([
    "customers.delete",
    "customers.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = deleteCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return customerFailure(
      "VALIDATION_ERROR",
      "Invalid customer id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const customer = await customerRepository.softDelete(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!customer) {
      return customerFailure("NOT_FOUND", "Customer not found.");
    }
    revalidateCustomerPaths(customer.id);
    return customerSuccess({ id: customer.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getCustomers(
  input: unknown = {}
): Promise<CustomerActionResult<CustomerListResult>> {
  const actor = await resolveCustomerActor([
    "customers.view",
    "customers.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = searchCustomerSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return customerFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await customerRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return customerSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getCustomerById(
  id: string
): Promise<CustomerActionResult<Customer>> {
  const actor = await resolveCustomerActor([
    "customers.view",
    "customers.manage",
  ]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return customerFailure("VALIDATION_ERROR", "Customer id is required.");
  }

  try {
    const customer = await customerRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!customer) {
      return customerFailure("NOT_FOUND", "Customer not found.");
    }
    return customerSuccess(customer);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getCustomerProfile(
  id: string
): Promise<CustomerActionResult<CustomerProfile>> {
  const actor = await resolveCustomerActor([
    "customers.view",
    "customers.manage",
  ]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return customerFailure("VALIDATION_ERROR", "Customer id is required.");
  }

  try {
    const profile = await customerRepository.getProfile(
      id,
      actor.data.restaurantId
    );
    if (!profile) {
      return customerFailure("NOT_FOUND", "Customer not found.");
    }
    return customerSuccess(profile);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateCustomerStatus(
  input: unknown
): Promise<CustomerActionResult<Customer>> {
  const actor = await resolveCustomerActor([
    "customers.edit",
    "customers.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateCustomerStatusSchema.safeParse(input);
  if (!parsed.success) {
    return customerFailure(
      "VALIDATION_ERROR",
      "Invalid status change.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const customer = await customerRepository.update(
      parsed.data.id,
      actor.data.restaurantId,
      {
        status: parsed.data.status,
        statusNote: parsed.data.note,
        updatedBy: actor.data.userId,
      }
    );
    if (!customer) {
      return customerFailure("NOT_FOUND", "Customer not found.");
    }
    revalidateCustomerPaths(customer.id);
    return customerSuccess(customer);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function addCustomerNote(
  input: unknown
): Promise<CustomerActionResult<Customer>> {
  const actor = await resolveCustomerActor([
    "customers.edit",
    "customers.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = addCustomerNoteSchema.safeParse(input);
  if (!parsed.success) {
    return customerFailure(
      "VALIDATION_ERROR",
      "Invalid note.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const customer = await customerRepository.addNote(
      parsed.data.id,
      actor.data.restaurantId,
      parsed.data.body,
      actor.data.userId
    );
    if (!customer) {
      return customerFailure("NOT_FOUND", "Customer not found.");
    }
    revalidateCustomerPaths(customer.id);
    return customerSuccess(customer);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getCustomerOptions(): Promise<
  CustomerActionResult<CustomerSelectOption[]>
> {
  const actor = await resolveCustomerActor([
    "customers.view",
    "customers.manage",
    "orders.view",
    "billing.view",
  ]);
  if (!actor.success) return actor;

  try {
    const options = await customerRepository.listOptions(
      actor.data.restaurantId
    );
    return customerSuccess(options);
  } catch (error) {
    return mapDbError(error);
  }
}
