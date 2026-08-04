import {
  connectToDatabase,
  handleDatabaseError,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import {
  buildKitchenSummary,
  groupTicketsByBoard,
  toKitchenTicket,
} from "@/lib/kitchen";
import { getChefLabel } from "@/config/kitchen";
import { OrderModel } from "@/models/order";
import { orderRepository } from "@/repositories/order";
import type {
  KitchenDashboardData,
  KitchenFilterOptions,
  KitchenTicket,
} from "@/types/kitchen";
import type { SearchKitchenInput } from "@/lib/validators/kitchen";
import { CHEF_OPTIONS } from "@/config/kitchen";
import { RestaurantTableModel } from "@/models/restaurant-table";

type OrderFilter = Record<string, unknown>;

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export const kitchenRepository = {
  async getDashboard(
    restaurantId: string,
    input: SearchKitchenInput
  ): Promise<KitchenDashboardData> {
    await connectToDatabase();
    try {
      const result = await orderRepository.findMany(restaurantId, {
        q: input.q ?? "",
        status: input.status,
        orderType: input.orderType,
        paymentStatus: "all",
        priority: input.priority,
        tableId: input.tableId ?? "",
        customerId: "",
        assignedChefId: input.assignedChefId ?? "",
        dateFrom: "",
        dateTo: "",
        page: 1,
        pageSize: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
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

      const completedToday = await OrderModel.countDocuments(
        notDeletedFilter({
          restaurantId: toObjectId(restaurantId),
          status: { $in: ["completed", "served"] },
          updatedAt: { $gte: startOfToday() },
        }) as OrderFilter
      );

      return {
        summary: buildKitchenSummary(tickets, completedToday),
        board: groupTicketsByBoard(tickets),
        tickets,
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load kitchen dashboard");
    }
  },

  async getFilterOptions(restaurantId: string): Promise<KitchenFilterOptions> {
    await connectToDatabase();
    try {
      const tables = await RestaurantTableModel.find(
        notDeletedFilter({
          restaurantId: toObjectId(restaurantId),
        }) as OrderFilter
      )
        .sort({ displayOrder: 1, tableNumber: 1 })
        .select({ tableNumber: 1, tableName: 1 })
        .limit(200)
        .lean()
        .exec();

      return {
        tables: tables.map((table) => ({
          value: String(table._id),
          label: `${table.tableNumber} · ${table.tableName}`,
        })),
        chefs: CHEF_OPTIONS,
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load kitchen filters");
    }
  },
};
