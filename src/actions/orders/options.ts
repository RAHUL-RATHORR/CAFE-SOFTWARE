"use server";

import { CUSTOMER_OPTIONS } from "@/config/orders";
import { orderFailure, orderSuccess } from "@/lib/orders";
import { MenuItemModel } from "@/models/menu-item";
import { RestaurantTableModel } from "@/models/restaurant-table";
import { CustomerModel } from "@/models/customer";
import {
  connectToDatabase,
  handleDatabaseError,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import { resolveOrderActor } from "@/actions/orders/context";
import type { OrderActionResult, OrderFormOptions } from "@/types/order";

export async function getOrderFormOptions(): Promise<
  OrderActionResult<OrderFormOptions>
> {
  const actor = await resolveOrderActor([
    "orders.view",
    "orders.create",
    "orders.edit",
    "orders.manage",
  ]);
  if (!actor.success) return actor;

  try {
    await connectToDatabase();
    const restaurantFilter = notDeletedFilter({
      restaurantId: toObjectId(actor.data.restaurantId),
    });

    const [tables, menuItems, customers] = await Promise.all([
      RestaurantTableModel.find(restaurantFilter as Record<string, unknown>)
        .sort({ displayOrder: 1, tableNumber: 1 })
        .select({ tableNumber: 1, tableName: 1, capacity: 1 })
        .limit(200)
        .lean()
        .exec(),
      MenuItemModel.find({
        ...(restaurantFilter as Record<string, unknown>),
        isAvailable: true,
      })
        .sort({ displayOrder: 1, name: 1 })
        .select({ name: 1, price: 1, discountPrice: 1 })
        .limit(300)
        .lean()
        .exec(),
      CustomerModel.find({
        ...(restaurantFilter as Record<string, unknown>),
        status: { $in: ["active", "vip"] },
      })
        .sort({ fullName: 1 })
        .select({ fullName: 1, phone: 1 })
        .limit(300)
        .lean()
        .exec(),
    ]);

    const crmCustomers = customers.map((customer) => ({
      value: String(customer._id),
      label: customer.fullName,
      meta: customer.phone,
    }));

    return orderSuccess({
      tables: tables.map((table) => ({
        value: String(table._id),
        label: `${table.tableNumber} · ${table.tableName}`,
        meta: `${table.capacity} seats`,
      })),
      customers:
        crmCustomers.length > 0
          ? [{ value: "", label: "Walk-in Guest" }, ...crmCustomers]
          : CUSTOMER_OPTIONS,
      menuItems: menuItems.map((item) => ({
        value: String(item._id),
        label: item.name,
        price:
          item.discountPrice != null
            ? Number(item.discountPrice)
            : Number(item.price ?? 0),
      })),
    });
  } catch (error) {
    const dbError = handleDatabaseError(error, "Failed to load order options");
    return orderFailure("DATABASE_ERROR", dbError.message);
  }
}
