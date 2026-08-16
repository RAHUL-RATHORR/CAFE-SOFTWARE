import { enforcePlanFeature } from "@/lib/subscription/guards";
import { tableQrService } from "@/lib/table-qr";
import { BranchModel } from "@/models/branch";
import { RestaurantTableModel } from "@/models/restaurant-table";
import {
  connectToDatabase,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import { resolvePublicRestaurant } from "@/lib/qr-ordering/resolve-restaurant";
import type { PublicRestaurantInfo } from "@/types/qr-ordering";

export type OrderingUnavailableReason =
  | "invalid"
  | "revoked"
  | "table_unavailable"
  | "branch_unavailable"
  | "restaurant_unavailable"
  | "ordering_unavailable";

export type OrderingSessionContext = {
  tableToken: string;
  restaurant: PublicRestaurantInfo;
  branch: {
    id: string | null;
    name: string;
  };
  table: {
    id: string;
    tableNumber: string;
    tableName: string;
    capacity: number;
    status: string;
  };
};

export type OrderingSessionResult =
  | { success: true; data: OrderingSessionContext }
  | {
      success: false;
      reason: OrderingUnavailableReason;
      title: string;
      description: string;
    };

const COPY: Record<
  OrderingUnavailableReason,
  { title: string; description: string }
> = {
  invalid: {
    title: "QR Code Invalid",
    description:
      "This QR code is not recognized. Ask restaurant staff for a new table code.",
  },
  revoked: {
    title: "This QR Code is no longer active.",
    description:
      "Ask staff to print a fresh table QR code so you can order again.",
  },
  table_unavailable: {
    title: "Table Currently Unavailable",
    description:
      "This table cannot accept orders right now. Please speak with restaurant staff.",
  },
  branch_unavailable: {
    title: "This branch is currently unavailable.",
    description:
      "Online ordering is paused for this outlet. Please speak with staff.",
  },
  restaurant_unavailable: {
    title: "Restaurant is currently unavailable.",
    description: "Please try again later or speak with restaurant staff.",
  },
  ordering_unavailable: {
    title: "Online ordering is temporarily unavailable.",
    description:
      "This restaurant cannot accept QR orders right now. Please order with staff.",
  },
};

export async function resolveOrderingSession(
  tableToken: string
): Promise<OrderingSessionResult> {
  const resolution = await tableQrService.resolvePublicToken(tableToken);
  if (resolution.state !== "valid" || !resolution.restaurantId || !resolution.tableId) {
    const reason =
      resolution.state === "valid" ? "invalid" : resolution.state;
    return { success: false, reason, ...COPY[reason] };
  }

  const feature = await enforcePlanFeature({
    restaurantId: resolution.restaurantId,
    feature: "qr-ordering",
  });
  if (!feature.success) {
    return { success: false, reason: "ordering_unavailable", ...COPY.ordering_unavailable };
  }

  const restaurant = await resolvePublicRestaurant(resolution.restaurantId);
  if (!restaurant) {
    return {
      success: false,
      reason: "restaurant_unavailable",
      ...COPY.restaurant_unavailable,
    };
  }

  await connectToDatabase();
  const table = await RestaurantTableModel.findOne(
    notDeletedFilter({
      _id: toObjectId(resolution.tableId),
      restaurantId: toObjectId(resolution.restaurantId),
    }) as Record<string, unknown>
  ).exec();

  if (!table || !table.isActive || table.status === "out-of-service") {
    return {
      success: false,
      reason: "table_unavailable",
      ...COPY.table_unavailable,
    };
  }

  let branchName = "Main";
  const branchId = table.branchId ? String(table.branchId) : null;
  if (branchId && isValidObjectId(branchId)) {
    const branch = await BranchModel.findOne(
      notDeletedFilter({
        _id: toObjectId(branchId),
        restaurantId: toObjectId(resolution.restaurantId),
      }) as Record<string, unknown>
    ).exec();
    if (!branch || branch.status !== "active") {
      return {
        success: false,
        reason: "branch_unavailable",
        ...COPY.branch_unavailable,
      };
    }
    branchName = branch.name;
  }

  return {
    success: true,
    data: {
      tableToken: resolution.token,
      restaurant,
      branch: { id: branchId, name: branchName },
      table: {
        id: String(table._id),
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        capacity: table.capacity,
        status: table.status,
      },
    },
  };
}
