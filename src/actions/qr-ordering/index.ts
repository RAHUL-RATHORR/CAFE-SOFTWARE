"use server";

import { qrOrderingRepository } from "@/repositories/qr-ordering";
import {
  createToken,
  qrFailure,
  qrSuccess,
  zodFieldErrors,
} from "@/lib/qr-ordering";
import { checkRateLimit } from "@/lib/rate-limit";
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
  GuestOrderConfirmation,
  PublicMenuPayload,
  PublicOrderingPayload,
  PublicOrderTrackPayload,
  QrOrderingActionResult,
} from "@/types/qr-ordering";
import type { RestaurantOrder } from "@/types/order";
import type { PublicOrderPlaceholderRecord } from "@/types/qr-ordering";
import type { CustomerSessionRecord } from "@/types/qr-ordering";
import { headers } from "next/headers";

async function publicClientKey() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "anonymous"
  );
}

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

export async function getOrderingMenuByToken(
  tableToken: string
): Promise<QrOrderingActionResult<PublicOrderingPayload>> {
  if (!tableToken?.trim()) {
    return qrFailure("QR_INVALID", "QR Code Invalid");
  }

  try {
    const data = await qrOrderingRepository.getOrderingMenu(tableToken.trim());
    if (!data) {
      return qrFailure("QR_INVALID", "Unable to open this table QR.");
    }
    return qrSuccess(data);
  } catch {
    return qrFailure("DATABASE_ERROR", "Unable to load ordering menu.");
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
    confirmation: GuestOrderConfirmation;
  }>
> {
  const limit = checkRateLimit("serverActions", await publicClientKey());
  if (!limit.allowed) {
    return qrFailure("FORBIDDEN", "Too many requests. Please wait a moment.");
  }

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
      const message = error.message;
      if (message === "INVALID" || message === "REVOKED") {
        return qrFailure("QR_INVALID", "This QR Code is no longer active.");
      }
      if (message === "TABLE_UNAVAILABLE") {
        return qrFailure("TABLE_UNAVAILABLE", "Table Currently Unavailable");
      }
      if (message === "BRANCH_UNAVAILABLE") {
        return qrFailure(
          "BRANCH_UNAVAILABLE",
          "This branch is currently unavailable."
        );
      }
      if (message === "RESTAURANT_UNAVAILABLE") {
        return qrFailure(
          "RESTAURANT_NOT_FOUND",
          "Restaurant is currently unavailable."
        );
      }
      if (message === "ORDERING_UNAVAILABLE") {
        return qrFailure(
          "ORDERING_UNAVAILABLE",
          "Online ordering is temporarily unavailable."
        );
      }
      if (message === "ITEM_UNAVAILABLE") {
        return qrFailure(
          "ITEM_UNAVAILABLE",
          "One or more items are unavailable."
        );
      }
      if (message.startsWith("VALIDATION:")) {
        return qrFailure("VALIDATION_ERROR", message.replace("VALIDATION:", ""));
      }
      if (message === "RESTAURANT_NOT_FOUND") {
        return qrFailure("RESTAURANT_NOT_FOUND", "Restaurant not found.");
      }
      if (message === "TABLE_NOT_FOUND") {
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
  const parsed = trackOrderSchema.safeParse({ token });
  if (!parsed.success) {
    return qrFailure(
      "VALIDATION_ERROR",
      "Invalid tracking request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = restaurant
      ? await qrOrderingRepository.trackOrder(restaurant, parsed.data.token)
      : await qrOrderingRepository.trackOrderByToken(parsed.data.token);
    if (!data) {
      return qrFailure("ORDER_NOT_FOUND", "Order not found.");
    }
    return qrSuccess(data);
  } catch {
    return qrFailure("DATABASE_ERROR", "Unable to track order.");
  }
}

export async function trackOrderByPublicToken(
  token: string
): Promise<QrOrderingActionResult<PublicOrderTrackPayload>> {
  const parsed = trackOrderSchema.safeParse({ token });
  if (!parsed.success) {
    return qrFailure(
      "VALIDATION_ERROR",
      "Invalid tracking request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await qrOrderingRepository.trackOrderByToken(parsed.data.token);
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
