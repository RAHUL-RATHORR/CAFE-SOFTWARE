import {
  connectToDatabase,
  handleDatabaseError,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import {
  buildKitchenSummary,
  groupTicketsByBoard,
  isValidStatusTransition,
  toKitchenTicket,
} from "@/lib/kitchen";
import { emitKitchenEvent } from "@/lib/kitchen/realtime";
import { eventDispatcher } from "@/lib/realtime/event-dispatcher";
import { getChefLabel, CHEF_OPTIONS } from "@/config/kitchen";
import { OrderModel } from "@/models/order";
import { BranchModel } from "@/models/branch";
import { RestaurantTableModel } from "@/models/restaurant-table";
import { orderRepository } from "@/repositories/order";
import type {
  KitchenDashboardData,
  KitchenFilterOptions,
  KitchenTicket,
} from "@/types/kitchen";
import type { SearchKitchenInput } from "@/lib/validators/kitchen";
import type { RestaurantOrder, RestaurantOrderStatus } from "@/types/order";

type OrderFilter = Record<string, unknown>;

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export type ChangeKitchenStatusParams = {
  orderId: string;
  restaurantId: string;
  nextStatus: RestaurantOrderStatus;
  userBranchId?: string | null;
  changedBy?: string | null;
  note?: string;
};

export const kitchenRepository = {
  async getDashboard(
    restaurantId: string,
    input: SearchKitchenInput,
    userBranchId?: string | null
  ): Promise<KitchenDashboardData> {
    await connectToDatabase();
    try {
      const effectiveBranchId =
        userBranchId || (input.branchId?.trim() ? input.branchId.trim() : "");

      const result = await orderRepository.findMany(restaurantId, {
        q: input.q ?? "",
        status: input.status,
        orderType: input.orderType,
        paymentStatus: "all",
        priority: input.priority,
        branchId: effectiveBranchId,
        tableId: input.tableId ?? "",
        customerId: "",
        assignedChefId: input.assignedChefId ?? "",
        dateFrom: "",
        dateTo: "",
        page: 1,
        pageSize: 100,
        sortBy: "createdAt",
        sortOrder: "asc",
      });

      const now = Date.now();
      const tickets = result.items
        .map((order) => {
          const ticket = toKitchenTicket(order, now);
          if (!ticket) return null;
          return {
            ...ticket,
            assignedChefLabel:
              getChefLabel(order.assignedChefId) ?? order.assignedChefLabel,
          };
        })
        .filter((ticket): ticket is KitchenTicket => ticket != null);

      const completedTodayFilter: OrderFilter = {
        restaurantId: toObjectId(restaurantId),
        status: { $in: ["completed", "served"] },
        updatedAt: { $gte: startOfToday() },
      };
      if (effectiveBranchId && isValidObjectId(effectiveBranchId)) {
        completedTodayFilter.branchId = toObjectId(effectiveBranchId);
      }

      const completedToday = await OrderModel.countDocuments(
        notDeletedFilter(completedTodayFilter) as OrderFilter
      );

      return {
        summary: buildKitchenSummary(tickets, completedToday),
        board: groupTicketsByBoard(tickets),
        tickets,
        activeBranchId: effectiveBranchId || null,
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load kitchen dashboard");
    }
  },

  async getFilterOptions(
    restaurantId: string,
    userBranchId?: string | null
  ): Promise<KitchenFilterOptions> {
    await connectToDatabase();
    try {
      const tableFilter: OrderFilter = {
        restaurantId: toObjectId(restaurantId),
      };
      if (userBranchId && isValidObjectId(userBranchId)) {
        tableFilter.branchId = toObjectId(userBranchId);
      }

      const [tables, branchDocs] = await Promise.all([
        RestaurantTableModel.find(notDeletedFilter(tableFilter) as OrderFilter)
          .sort({ displayOrder: 1, tableNumber: 1 })
          .select({ tableNumber: 1, tableName: 1 })
          .limit(200)
          .lean()
          .exec(),
        BranchModel.find(
          notDeletedFilter({
            restaurantId: toObjectId(restaurantId),
            status: "active",
          }) as OrderFilter
        )
          .select({ name: 1, branchCode: 1, isMainBranch: 1 })
          .sort({ isMainBranch: -1, name: 1 })
          .lean()
          .exec(),
      ]);

      const branches = branchDocs.map((doc) => ({
        id: String(doc._id),
        name: doc.name,
        branchCode: doc.branchCode,
        isMainBranch: Boolean(doc.isMainBranch),
      }));

      return {
        tables: tables.map((table) => ({
          value: String(table._id),
          label: `${table.tableNumber} · ${table.tableName}`,
        })),
        chefs: CHEF_OPTIONS,
        branches,
        canSwitchBranch: !userBranchId,
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load kitchen filters");
    }
  },

  async changeOrderStatusAtomic(
    params: ChangeKitchenStatusParams
  ): Promise<RestaurantOrder> {
    await connectToDatabase();
    if (!isValidObjectId(params.orderId)) {
      throw new Error("INVALID_ID");
    }

    const queryFilter: OrderFilter = {
      _id: toObjectId(params.orderId),
      restaurantId: toObjectId(params.restaurantId),
    };

    // If user is restricted to a branch, verify branch ownership
    if (params.userBranchId && isValidObjectId(params.userBranchId)) {
      queryFilter.branchId = toObjectId(params.userBranchId);
    }

    const existing = await OrderModel.findOne(
      notDeletedFilter(queryFilter) as OrderFilter
    ).exec();

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    // Validate status transition
    if (
      !isValidStatusTransition(
        existing.status as RestaurantOrderStatus,
        params.nextStatus
      )
    ) {
      throw new Error(
        `INVALID_TRANSITION: Cannot transition order from ${existing.status} to ${params.nextStatus}`
      );
    }

    // Idempotent check
    if (existing.status === params.nextStatus) {
      const order = await orderRepository.findById(
        params.orderId,
        params.restaurantId
      );
      if (!order) throw new Error("NOT_FOUND");
      return order;
    }

    // Atomic update with status concurrency guard
    const atomicFilter: OrderFilter = {
      _id: toObjectId(params.orderId),
      restaurantId: toObjectId(params.restaurantId),
      status: existing.status,
    };
    if (params.userBranchId && isValidObjectId(params.userBranchId)) {
      atomicFilter.branchId = toObjectId(params.userBranchId);
    }

    const updatedDoc = await OrderModel.findOneAndUpdate(
      notDeletedFilter(atomicFilter) as OrderFilter,
      {
        $set: {
          status: params.nextStatus,
          updatedBy: params.changedBy && isValidObjectId(params.changedBy)
            ? toObjectId(params.changedBy)
            : null,
        },
        $push: {
          statusHistory: {
            status: params.nextStatus,
            changedAt: new Date(),
            changedBy:
              params.changedBy && isValidObjectId(params.changedBy)
                ? toObjectId(params.changedBy)
                : null,
            note:
              params.note?.trim() || `Status updated to ${params.nextStatus}`,
          },
        },
        $inc: { version: 1 },
      },
      { new: true, runValidators: true }
    ).exec();

    let resolvedOrder: RestaurantOrder | null = null;
    if (!updatedDoc) {
      // Concurrency check: another staff might have just changed it
      const current = await orderRepository.findById(
        params.orderId,
        params.restaurantId
      );
      if (!current) throw new Error("NOT_FOUND");
      if (current.status === params.nextStatus) {
        resolvedOrder = current;
      } else {
        throw new Error(
          `CONFLICT: Order was modified by another staff member to ${current.status}`
        );
      }
    } else {
      resolvedOrder = await orderRepository.findById(
        params.orderId,
        params.restaurantId
      );
    }

    if (!resolvedOrder) {
      throw new Error("NOT_FOUND");
    }

    // Emit Real-Time KDS Event
    const realtimeType =
      params.nextStatus === "cancelled"
        ? "ORDER_CANCELLED"
        : "ORDER_UPDATED";

    await emitKitchenEvent({
      type: realtimeType,
      restaurantId: params.restaurantId,
      branchId: resolvedOrder.branchId,
      orderId: resolvedOrder.id,
      orderNumber: resolvedOrder.orderNumber,
      status: resolvedOrder.status,
      timestamp: new Date().toISOString(),
      order: resolvedOrder,
    });

    // Audit / Activity Log
    await eventDispatcher
      .dispatch({
        eventType: "kitchen.status_changed",
        restaurantId: params.restaurantId,
        branchId: resolvedOrder.branchId,
        userId: params.changedBy,
        source: "kitchen",
        title: `Order ${resolvedOrder.orderNumber} ${params.nextStatus}`,
        message:
          params.note || `Order moved to ${params.nextStatus}`,
        payload: {
          orderId: resolvedOrder.id,
          orderNumber: resolvedOrder.orderNumber,
          status: resolvedOrder.status,
        },
        createNotification: false,
        createActivity: true,
      })
      .catch(() => {
        /* non-blocking activity log error */
      });

    return resolvedOrder;
  },
};
