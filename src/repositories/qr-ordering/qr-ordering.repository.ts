import {
  connectToDatabase,
  handleDatabaseError,
  isDatabaseError,
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
  resolvePublicRestaurant,
  serializeCustomerSession,
  serializePublicOrderPlaceholder,
  serializeQrCode,
} from "@/lib/qr-ordering";
import {
  computeGuestOrderTotals,
  unitPriceFromMenuItem,
  validateAndPriceCustomizations,
} from "@/lib/qr-ordering/pricing";
import { resolveOrderingSession } from "@/lib/qr-ordering/resolve-ordering-session";
import { createOpaqueQrToken } from "@/lib/qr-code";
import { sanitizeText } from "@/lib/security";
import { settingsRepository } from "@/repositories/settings";
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
  confirmation: {
    orderNumber: string;
    trackingToken: string;
    tableLabel: string;
    grandTotal: number;
    currency: string;
    statusLabel: string;
  };
}> {
  try {
    const sessionCtx = await resolveOrderingSession(input.tableToken);
    if (!sessionCtx.success) {
      throw new Error(sessionCtx.reason.toUpperCase());
    }

    const { restaurant, branch, table } = sessionCtx.data;

    await connectToDatabase();
    const existing = await PublicOrderPlaceholderModel.findOne(
      notDeletedFilter({
        restaurantId: toObjectId(restaurant.id),
        idempotencyKey: input.idempotencyKey,
      }) as Filter
    ).exec();

    if (existing) {
      const order = existing.orderId
        ? await orderRepository.findById(String(existing.orderId), restaurant.id)
        : null;
      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }
      const placeholder = serializePublicOrderPlaceholder(existing);
      return {
        placeholder,
        order,
        trackingToken: placeholder.trackingToken,
        session: {
          id: "",
          restaurantId: restaurant.id,
          branchId: branch.id,
          tableId: table.id,
          sessionToken: "",
          guestName: input.guestName ?? "",
          guestPhone: input.guestPhone ?? "",
          guestEmail: input.guestEmail ?? "",
          cartSnapshot: [],
          expiresAt: null,
          createdAt: placeholder.createdAt,
          updatedAt: placeholder.updatedAt,
        },
        confirmation: {
          orderNumber: order.orderNumber,
          trackingToken: placeholder.trackingToken,
          tableLabel: `${table.tableName} (${table.tableNumber})`,
          grandTotal: order.grandTotal,
          currency: restaurant.currency,
          statusLabel: PUBLIC_ORDER_STATUS_LABELS[order.status],
        },
      };
    }

    const menuIds = [...new Set(input.items.map((item) => item.menuItemId))];
    const catalog = await Promise.all(
      menuIds.map((id) => menuItemRepository.findById(id, restaurant.id))
    );
    const byId = new Map(
      catalog
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item) => [item.id, item])
    );

    const pricedInput: Array<{
      menuItemId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      notes: string;
      taxRate: number;
      customizations: Array<{
        groupId: string;
        groupName: string;
        optionId: string;
        optionName: string;
        priceDelta: number;
      }>;
      isVeg: boolean;
      image: string;
    }> = [];

    for (const line of input.items) {
      const menuItem = byId.get(line.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new Error("ITEM_UNAVAILABLE");
      }
      if (menuItem.branchId && branch.id && menuItem.branchId !== branch.id) {
        throw new Error("ITEM_UNAVAILABLE");
      }

      const customization = validateAndPriceCustomizations({
        groups: menuItem.customizationGroups ?? [],
        selections: line.customizations ?? [],
      });
      if (!customization.ok) {
        throw new Error(`VALIDATION:${customization.message}`);
      }

      pricedInput.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitPrice: unitPriceFromMenuItem(menuItem),
        quantity: line.quantity,
        notes: sanitizeText(line.notes ?? "").slice(0, 255),
        taxRate: menuItem.taxRate ?? 0,
        customizations: customization.rows,
        isVeg: menuItem.isVeg,
        image: menuItem.image,
      });
    }

    const taxSettings = await settingsRepository.getOrCreateTax(restaurant.id);
    const totals = computeGuestOrderTotals({
      lines: pricedInput.map((line) => ({
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        customizations: line.customizations,
        taxRate: line.taxRate,
      })),
      taxSettings,
    });

    const guestName = sanitizeText(input.guestName ?? "").slice(0, 120);
    const guestPhone = sanitizeText(input.guestPhone ?? "").slice(0, 32);
    const orderNotes = sanitizeText(input.notes ?? "").slice(0, 500);

    let order: RestaurantOrder | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        order = await orderRepository.create({
          restaurantId: restaurant.id,
          branchId: branch.id,
          tableId: table.id,
          orderType: "dine-in",
          status: "pending",
          paymentStatus: "pending",
          paymentMethod: "none",
          notes: [
            orderNotes,
            guestName ? `Guest: ${guestName}` : "",
            guestPhone ? `Phone: ${guestPhone}` : "",
            `Payment: ${input.paymentPlaceholder} (placeholder)`,
            "Source: QR ordering",
          ]
            .filter(Boolean)
            .join(" · "),
          items: pricedInput.map((line, index) => ({
            menuItemId: line.menuItemId,
            name: line.name,
            price: totals.lines[index]?.unitPrice ?? line.unitPrice,
            quantity: line.quantity,
            discount: 0,
            tax: 0,
            notes: line.notes,
            customizations: line.customizations,
          })),
          subtotal: totals.subtotal,
          tax: totals.tax,
          serviceCharge: totals.serviceCharge,
          grandTotal: totals.grandTotal,
          createdBy: null,
        });
        break;
      } catch (error) {
        if (!isDatabaseError(error) || error.code !== "DATABASE_DUPLICATE_KEY") {
          throw error;
        }
        if (attempt === 2) throw error;
      }
    }

    if (!order) {
      throw new Error("DATABASE_ERROR");
    }

    const trackingToken = createOpaqueQrToken();
    const sessionToken = createOpaqueQrToken();

    const [placeholderDoc, sessionDoc] = await Promise.all([
      PublicOrderPlaceholderModel.create({
        restaurantId: toObjectId(restaurant.id),
        branchId: optionalRef(branch.id),
        tableId: optionalRef(table.id),
        orderId: toObjectId(order.id),
        trackingToken,
        orderNumber: order.orderNumber,
        guestName,
        guestPhone,
        status: order.status,
        estimatedMinutes: 25,
        notes: orderNotes,
        idempotencyKey: input.idempotencyKey,
      }),
      CustomerSessionModel.create({
        restaurantId: toObjectId(restaurant.id),
        branchId: optionalRef(branch.id),
        tableId: optionalRef(table.id),
        sessionToken,
        guestName,
        guestPhone,
        guestEmail: sanitizeText(input.guestEmail ?? "").slice(0, 160),
        cartSnapshot: pricedInput.map((line, index) => ({
          key: `${line.menuItemId}:${index}`,
          menuItemId: line.menuItemId,
          name: line.name,
          price: totals.lines[index]?.unitPrice ?? line.unitPrice,
          quantity: line.quantity,
          notes: line.notes,
          isVeg: line.isVeg,
          image: line.image,
          customizations: Object.values(
            line.customizations.reduce<
              Record<string, { groupId: string; optionIds: string[] }>
            >((acc, row) => {
              const existing = acc[row.groupId] ?? {
                groupId: row.groupId,
                optionIds: [],
              };
              existing.optionIds.push(row.optionId);
              acc[row.groupId] = existing;
              return acc;
            }, {})
          ),
        })),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6),
      }),
    ]);

    // Prompt 51 extension point — no WhatsApp/SMS/email sends here.
    void ({
      channel: "notification.extension",
      event: "qr_order.placed",
      orderId: order.id,
      restaurantId: restaurant.id,
    } as const);

    const placeholder = serializePublicOrderPlaceholder(placeholderDoc);
    return {
      placeholder,
      order,
      trackingToken,
      session: serializeCustomerSession(sessionDoc),
      confirmation: {
        orderNumber: order.orderNumber,
        trackingToken,
        tableLabel: `${table.tableName} (${table.tableNumber})`,
        grandTotal: order.grandTotal,
        currency: restaurant.currency,
        statusLabel: PUBLIC_ORDER_STATUS_LABELS[order.status],
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (
        [
          "INVALID",
          "REVOKED",
          "TABLE_UNAVAILABLE",
          "BRANCH_UNAVAILABLE",
          "RESTAURANT_UNAVAILABLE",
          "ORDERING_UNAVAILABLE",
          "ITEM_UNAVAILABLE",
          "ORDER_NOT_FOUND",
        ].includes(error.message) ||
        error.message.startsWith("VALIDATION:")
      ) {
        throw error;
      }
    }
    throw handleDatabaseError(error, "Failed to create guest order");
  }
}

async function getOrderingMenu(tableToken: string) {
  const sessionCtx = await resolveOrderingSession(tableToken);
  if (!sessionCtx.success) return null;

  const { restaurant, branch, table } = sessionCtx.data;
  const [categoriesResult, itemsResult, featuredResult] = await Promise.all([
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
      q: "",
      categoryId: "",
      availability: "all",
      veg: "all",
      featured: "all",
      page: 1,
      pageSize: 100,
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
  ]);

  const items = itemsResult.items.filter(
    (item) => !item.branchId || !branch.id || item.branchId === branch.id
  );

  return {
    tableToken: sessionCtx.data.tableToken,
    restaurant,
    branch,
    table,
    categories: categoriesResult.items as Category[],
    featuredItems: featuredResult.items.filter((item) => item.isFeatured),
    items,
  };
}

async function trackOrderByToken(
  token: string
): Promise<PublicOrderTrackPayload | null> {
  try {
    await connectToDatabase();
    const doc = await PublicOrderPlaceholderModel.findOne(
      notDeletedFilter({
        trackingToken: token.trim(),
      }) as Filter
    );
    if (!doc) return null;

    const restaurantId = String(doc.restaurantId);
    const restaurant = await resolvePublicRestaurant(restaurantId);
    const placeholder = serializePublicOrderPlaceholder(doc);
    let order: RestaurantOrder | null = null;
    if (placeholder.orderId) {
      order = await orderRepository.findById(placeholder.orderId, restaurantId);
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

    if (order && order.status !== placeholder.status) {
      await PublicOrderPlaceholderModel.updateOne(
        { _id: doc._id },
        { $set: { status: order.status } }
      );
      placeholder.status = order.status;
    }

    let tableLabel: string | undefined;
    if (placeholder.tableId) {
      const table = await restaurantTableRepository.findById(
        placeholder.tableId,
        restaurantId
      );
      if (table) {
        tableLabel = `${table.tableName} (${table.tableNumber})`;
      }
    }

    return {
      placeholder,
      order,
      timeline,
      restaurantName: restaurant?.name,
      tableLabel,
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to track order");
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
      }) as Filter
    );
    if (!doc) return null;

    return trackOrderByToken(token);
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
  getOrderingMenu,
  getCategories,
  getMenuItems,
  createGuestOrder,
  trackOrder,
  trackOrderByToken,
  getCustomerProfilePlaceholder,
  ensureQrCode,
  resolveTable,
};
