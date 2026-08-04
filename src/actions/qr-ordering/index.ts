"use server";

import { qrOrderingRepository } from "@/repositories/qr-ordering";
import {
  createToken,
  qrFailure,
  qrSuccess,
  zodFieldErrors,
} from "@/lib/qr-ordering";
import {
  createGuestOrderSchema,
  publicMenuQuerySchema,
  publicRestaurantParamSchema,
  trackOrderSchema,
} from "@/lib/validators/qr-ordering";
import type { Category } from "@/types/category";
import type { MenuItem } from "@/types/menu-item";
import type {
  CustomerProfilePlaceholder,
  PublicMenuPayload,
  PublicOrderTrackPayload,
  QrOrderingActionResult,
} from "@/types/qr-ordering";
import type { RestaurantOrder } from "@/types/order";
import type { PublicOrderPlaceholderRecord } from "@/types/qr-ordering";
import type { CustomerSessionRecord } from "@/types/qr-ordering";

export async function getPublicMenu(
  restaurant: string,
  options?: {
    table?: string;
    q?: string;
    categoryId?: string | null;
    dietary?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<QrOrderingActionResult<PublicMenuPayload>> {
  const params = publicRestaurantParamSchema.safeParse({
    restaurant,
    table: options?.table,
  });
  if (!params.success) {
    return qrFailure(
      "VALIDATION_ERROR",
      "Invalid restaurant.",
      zodFieldErrors(params.error.issues)
    );
  }

  const query = publicMenuQuerySchema.safeParse({
    q: options?.q ?? "",
    categoryId: options?.categoryId ?? "",
    dietary: options?.dietary ?? "all",
    page: options?.page ?? 1,
    pageSize: options?.pageSize ?? 48,
  });
  if (!query.success) {
    return qrFailure(
      "VALIDATION_ERROR",
      "Invalid menu filters.",
      zodFieldErrors(query.error.issues)
    );
  }

  try {
    const data = await qrOrderingRepository.getPublicMenu(
      params.data.restaurant,
      params.data.table,
      query.data
    );
    if (!data) {
      return qrFailure("RESTAURANT_NOT_FOUND", "Restaurant not found.");
    }
    return qrSuccess(data);
  } catch {
    return qrFailure("DATABASE_ERROR", "Unable to load menu.");
  }
}

export async function getCategories(
  restaurant: string
): Promise<QrOrderingActionResult<Category[]>> {
  const params = publicRestaurantParamSchema.safeParse({ restaurant });
  if (!params.success) {
    return qrFailure(
      "VALIDATION_ERROR",
      "Invalid restaurant.",
      zodFieldErrors(params.error.issues)
    );
  }

  try {
    const data = await qrOrderingRepository.getCategories(
      params.data.restaurant
    );
    return qrSuccess(data);
  } catch {
    return qrFailure("DATABASE_ERROR", "Unable to load categories.");
  }
}

export async function getMenuItems(
  restaurant: string,
  options?: {
    q?: string;
    categoryId?: string | null;
    dietary?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<QrOrderingActionResult<MenuItem[]>> {
  const params = publicRestaurantParamSchema.safeParse({ restaurant });
  if (!params.success) {
    return qrFailure(
      "VALIDATION_ERROR",
      "Invalid restaurant.",
      zodFieldErrors(params.error.issues)
    );
  }

  const query = publicMenuQuerySchema.safeParse({
    q: options?.q ?? "",
    categoryId: options?.categoryId ?? "",
    dietary: options?.dietary ?? "all",
    page: options?.page ?? 1,
    pageSize: options?.pageSize ?? 48,
  });
  if (!query.success) {
    return qrFailure(
      "VALIDATION_ERROR",
      "Invalid filters.",
      zodFieldErrors(query.error.issues)
    );
  }

  try {
    const data = await qrOrderingRepository.getMenuItems(
      params.data.restaurant,
      query.data
    );
    return qrSuccess(data);
  } catch {
    return qrFailure("DATABASE_ERROR", "Unable to load menu items.");
  }
}

export async function createGuestOrder(
  input: unknown
): Promise<
  QrOrderingActionResult<{
    placeholder: PublicOrderPlaceholderRecord;
    order: RestaurantOrder;
    trackingToken: string;
    session: CustomerSessionRecord;
  }>
> {
  const parsed = createGuestOrderSchema.safeParse(input);
  if (!parsed.success) {
    return qrFailure(
      "VALIDATION_ERROR",
      "Invalid checkout details.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  if (!parsed.data.items.length) {
    return qrFailure("EMPTY_CART", "Your cart is empty.");
  }

  try {
    const data = await qrOrderingRepository.createGuestOrder(parsed.data);
    return qrSuccess(data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "RESTAURANT_NOT_FOUND") {
        return qrFailure("RESTAURANT_NOT_FOUND", "Restaurant not found.");
      }
      if (error.message === "TABLE_NOT_FOUND") {
        return qrFailure("TABLE_NOT_FOUND", "Table not found.");
      }
    }
    return qrFailure("DATABASE_ERROR", "Unable to place order.");
  }
}

export async function trackOrder(
  restaurant: string,
  token: string
): Promise<QrOrderingActionResult<PublicOrderTrackPayload>> {
  const parsed = trackOrderSchema.safeParse({ restaurant, token });
  if (!parsed.success) {
    return qrFailure(
      "VALIDATION_ERROR",
      "Invalid tracking request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await qrOrderingRepository.trackOrder(
      parsed.data.restaurant,
      parsed.data.token
    );
    if (!data) {
      return qrFailure("ORDER_NOT_FOUND", "Order not found.");
    }
    return qrSuccess(data);
  } catch {
    return qrFailure("DATABASE_ERROR", "Unable to track order.");
  }
}

export async function getCustomerProfilePlaceholder(): Promise<
  QrOrderingActionResult<CustomerProfilePlaceholder>
> {
  return qrSuccess(qrOrderingRepository.getCustomerProfilePlaceholder());
}

/** Exported for QR foundation diagnostics — no external QR API. */
export async function getQrFoundationToken(): Promise<
  QrOrderingActionResult<{ token: string }>
> {
  return qrSuccess({ token: createToken("qr") });
}
