import {
  connectToDatabase,
  handleDatabaseError,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import {
  buildQrPlaceholderCode,
  PUBLIC_ORDER_STATUS_LABELS,
  PUBLIC_TRACKING_STEPS,
} from "@/config/qr-ordering";
import {
  createToken,
  computeGuestTotals,
  resolvePublicRestaurant,
  serializeCustomerSession,
  serializePublicOrderPlaceholder,
  serializeQrCode,
} from "@/lib/qr-ordering";
import {
  CustomerSessionModel,
  PublicOrderPlaceholderModel,
  QrCodeModel,
} from "@/models/qr-ordering";
import { categoryRepository } from "@/repositories/category";
import { menuItemRepository } from "@/repositories/menu-item";
import { orderRepository } from "@/repositories/order";
import { restaurantTableRepository } from "@/repositories/restaurant-table";
import type {
  CreateGuestOrderInput,
  PublicMenuQueryInput,
} from "@/lib/validators/qr-ordering";
import type {
  CustomerProfilePlaceholder,
  CustomerSessionRecord,
  PublicMenuPayload,
  PublicOrderPlaceholderRecord,
  PublicOrderTrackPayload,
  PublicTableInfo,
  QrCodeRecord,
  QrCodeType,
} from "@/types/qr-ordering";
import type { Category } from "@/types/category";
import type { MenuItem } from "@/types/menu-item";
import type { RestaurantOrder } from "@/types/order";

type Filter = Record<string, unknown>;

function optionalRef(id: string | null | undefined) {
  if (!id || !isValidObjectId(id)) return null;
  return toObjectId(id);
}

async function resolveTable(
  restaurantId: string,
  tableParam?: string | null
): Promise<PublicTableInfo | null> {
  if (!tableParam?.trim()) return null;
  const param = tableParam.trim();

  if (isValidObjectId(param)) {
    const byId = await restaurantTableRepository.findById(param, restaurantId);
    if (byId) {
      return {
        id: byId.id,
        tableNumber: byId.tableNumber,
        tableName: byId.tableName,
        capacity: byId.capacity,
        status: byId.status,
      };
    }
  }

  const byNumber = await restaurantTableRepository.findByTableNumber(
    param,
    restaurantId
  );
  if (!byNumber) return null;
  return {
    id: byNumber.id,
    tableNumber: byNumber.tableNumber,
    tableName: byNumber.tableName,
    capacity: byNumber.capacity,
    status: byNumber.status,
  };
}

async function ensureQrCode(input: {
  restaurantId: string;
  type: QrCodeType;
  branchId?: string | null;
  tableId?: string | null;
  tableNumber?: string | null;
}): Promise<QrCodeRecord> {
  await connectToDatabase();
  const filter: Filter = notDeletedFilter({
    restaurantId: toObjectId(input.restaurantId),
    type: input.type,
  });
  if (input.tableId && isValidObjectId(input.tableId)) {
    filter.tableId = toObjectId(input.tableId);
  } else if (input.type === "table") {
    filter.tableId = null;
  }

  let doc = await QrCodeModel.findOne(filter);
  if (!doc) {
    const code = buildQrPlaceholderCode(input);
    doc = await QrCodeModel.create({
      restaurantId: toObjectId(input.restaurantId),
      branchId: optionalRef(input.branchId),
      tableId: optionalRef(input.tableId),
      type: input.type,
      code,
      token: createToken("qr"),
      isActive: true,
      expiresAt: null,
      metadata: { dynamic: true },
    });
  }
  return serializeQrCode(doc);
}

async function getPublicMenu(
  restaurantParam: string,
  tableParam: string | undefined,
  query: PublicMenuQueryInput
): Promise<PublicMenuPayload | null> {
  try {
    const restaurant = await resolvePublicRestaurant(restaurantParam);
    if (!restaurant) return null;

    const table = await resolveTable(restaurant.id, tableParam);

    const dietary = query.dietary;
    const vegFilter =
      dietary === "veg"
        ? "veg"
        : dietary === "non-veg"
          ? "non-veg"
          : "all";

    const [categoriesResult, itemsResult, featuredResult, qr] =
      await Promise.all([
        categoryRepository.findMany(restaurant.id, {
          q: "",
          status: "active",
          createdFrom: "",
          createdTo: "",
          branchId: "",
          page: 1,
          pageSize: 100,
          sortBy: "displayOrder",
          sortOrder: "asc",
        }),
        menuItemRepository.findMany(restaurant.id, {
          q: query.q ?? "",
          categoryId: query.categoryId ?? "",
          availability: "available",
          veg: vegFilter,
          featured: "all",
          page: query.page,
          pageSize: query.pageSize,
          sortBy: "displayOrder",
          sortOrder: "asc",
        }),
        menuItemRepository.findMany(restaurant.id, {
          q: "",
          categoryId: "",
          availability: "available",
          veg: "all",
          featured: "featured",
          page: 1,
          pageSize: 8,
          sortBy: "displayOrder",
          sortOrder: "asc",
        }),
        ensureQrCode({
          restaurantId: restaurant.id,
          type: table ? "table" : "restaurant",
          tableId: table?.id,
          tableNumber: table?.tableNumber,
        }),
      ]);

    let items = itemsResult.items;
    if (dietary === "popular") {
      items = items.filter((item) => item.isFeatured);
    }
    if (dietary === "vegan") {
      // Soft filter — tags or veg items tagged vegan
      items = items.filter(
        (item) =>
          item.isVeg &&
          item.tags.some((tag) => tag.toLowerCase().includes("vegan"))
      );
    }
    if (dietary === "spicy") {
      // FUTURE PLACEHOLDER — spicy tag filter
      items = items.filter((item) =>
        item.tags.some((tag) => tag.toLowerCase().includes("spicy"))
      );
    }

    const featuredItems = featuredResult.items.filter((item) => item.isFeatured);
    const popularFallback =
      featuredItems.length > 0
        ? featuredItems
        : featuredResult.items.slice(0, 4);

    return {
      restaurant,
      table,
      categories: categoriesResult.items as Category[],
      featuredItems: popularFallback,
      items: items as MenuItem[],
      qr: {
        type: qr.type,
        code: qr.code,
        dynamicPayload: qr.code,
        validated: qr.isActive,
        expired: Boolean(qr.expiresAt && new Date(qr.expiresAt) < new Date()),
      },
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to load public menu");
  }
}

async function getCategories(restaurantParam: string): Promise<Category[]> {
  const restaurant = await resolvePublicRestaurant(restaurantParam);
  if (!restaurant) return [];
  const result = await categoryRepository.findMany(restaurant.id, {
    q: "",
    status: "active",
    createdFrom: "",
    createdTo: "",
    branchId: "",
    page: 1,
    pageSize: 100,
    sortBy: "displayOrder",
    sortOrder: "asc",
  });
  return result.items;
}

async function getMenuItems(
  restaurantParam: string,
  query: PublicMenuQueryInput
): Promise<MenuItem[]> {
  const restaurant = await resolvePublicRestaurant(restaurantParam);
  if (!restaurant) return [];
  const result = await menuItemRepository.findMany(restaurant.id, {
    q: query.q ?? "",
    categoryId: query.categoryId ?? "",
    availability: "available",
    veg:
      query.dietary === "veg"
        ? "veg"
        : query.dietary === "non-veg"
          ? "non-veg"
          : "all",
    featured: query.dietary === "popular" ? "featured" : "all",
    page: query.page,
    pageSize: query.pageSize,
    sortBy: "displayOrder",
    sortOrder: "asc",
  });
  return result.items;
}

async function createGuestOrder(input: CreateGuestOrderInput): Promise<{
  placeholder: PublicOrderPlaceholderRecord;
  order: RestaurantOrder;
  trackingToken: string;
  session: CustomerSessionRecord;
}> {
  try {
    const restaurant = await resolvePublicRestaurant(input.restaurant);
    if (!restaurant) {
      throw new Error("RESTAURANT_NOT_FOUND");
    }

    const table = await resolveTable(restaurant.id, input.table);
    if (input.table && !table) {
      throw new Error("TABLE_NOT_FOUND");
    }

    const totals = computeGuestTotals(input.items);
    const order = await orderRepository.create({
      restaurantId: restaurant.id,
      tableId: table?.id ?? null,
      orderType: "dine-in",
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "none",
      notes: [
        input.notes,
        input.guestName ? `Guest: ${input.guestName}` : "",
        input.guestPhone ? `Phone: ${input.guestPhone}` : "",
        `Payment: ${input.paymentPlaceholder} (placeholder)`,
      ]
        .filter(Boolean)
        .join(" · "),
      items: input.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: 0,
        tax: 0,
        notes: item.notes ?? "",
      })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      serviceCharge: totals.serviceCharge,
      grandTotal: totals.grandTotal,
      createdBy: null,
    });

    await connectToDatabase();
    const trackingToken = createToken("trk");
    const sessionToken = createToken("sess");

    const [placeholderDoc, sessionDoc] = await Promise.all([
      PublicOrderPlaceholderModel.create({
        restaurantId: toObjectId(restaurant.id),
        tableId: optionalRef(table?.id),
        orderId: toObjectId(order.id),
        trackingToken,
        orderNumber: order.orderNumber,
        guestName: input.guestName,
        guestPhone: input.guestPhone ?? "",
        status: order.status,
        estimatedMinutes: 25,
        notes: input.notes ?? "",
      }),
      CustomerSessionModel.create({
        restaurantId: toObjectId(restaurant.id),
        tableId: optionalRef(table?.id),
        sessionToken,
        guestName: input.guestName,
        guestPhone: input.guestPhone ?? "",
        guestEmail: input.guestEmail ?? "",
        cartSnapshot: input.items,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6),
      }),
    ]);

    return {
      placeholder: serializePublicOrderPlaceholder(placeholderDoc),
      order,
      trackingToken,
      session: serializeCustomerSession(sessionDoc),
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "RESTAURANT_NOT_FOUND") throw error;
      if (error.message === "TABLE_NOT_FOUND") throw error;
    }
    throw handleDatabaseError(error, "Failed to create guest order");
  }
}

async function trackOrder(
  restaurantParam: string,
  token: string
): Promise<PublicOrderTrackPayload | null> {
  try {
    const restaurant = await resolvePublicRestaurant(restaurantParam);
    if (!restaurant) return null;

    await connectToDatabase();
    const doc = await PublicOrderPlaceholderModel.findOne(
      notDeletedFilter({
        restaurantId: toObjectId(restaurant.id),
        trackingToken: token.trim(),
      })
    );
    if (!doc) return null;

    const placeholder = serializePublicOrderPlaceholder(doc);
    let order: RestaurantOrder | null = null;
    if (placeholder.orderId) {
      order = await orderRepository.findById(
        placeholder.orderId,
        restaurant.id
      );
    }

    const currentStatus = order?.status ?? placeholder.status;
    const cancelled = currentStatus === "cancelled";
    const currentIndex = PUBLIC_TRACKING_STEPS.indexOf(
      cancelled ? "pending" : currentStatus
    );

    const timeline = PUBLIC_TRACKING_STEPS.map((status, index) => ({
      status,
      label: PUBLIC_ORDER_STATUS_LABELS[status],
      completed: !cancelled && currentIndex >= 0 && index <= currentIndex,
      active: !cancelled && status === currentStatus,
    }));

    if (cancelled) {
      timeline.push({
        status: "cancelled",
        label: PUBLIC_ORDER_STATUS_LABELS.cancelled,
        completed: true,
        active: true,
      });
    }

    // Keep placeholder status in sync when order advances
    if (order && order.status !== placeholder.status) {
      await PublicOrderPlaceholderModel.updateOne(
        { _id: doc._id },
        { $set: { status: order.status } }
      );
      placeholder.status = order.status;
    }

    return { placeholder, order, timeline };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to track order");
  }
}

function getCustomerProfilePlaceholder(): CustomerProfilePlaceholder {
  return {
    orderHistory: [],
    favoriteItems: [],
    savedPreferences: {},
    loyaltyPoints: 0,
  };
}

export const qrOrderingRepository = {
  getPublicMenu,
  getCategories,
  getMenuItems,
  createGuestOrder,
  trackOrder,
  getCustomerProfilePlaceholder,
  ensureQrCode,
  resolveTable,
};
