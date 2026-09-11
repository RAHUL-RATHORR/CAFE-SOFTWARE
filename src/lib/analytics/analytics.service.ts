import { Types } from "mongoose";
import { BillModel } from "@/models/billing";
import { OrderModel } from "@/models/order";
import { PaymentModel } from "@/models/billing";
import { DailyClosingModel } from "@/models/closing";

export interface AnalyticsFilter {
  restaurantId: string;
  branchId?: string;
  startDate: Date;
  endDate: Date;
}

export class AnalyticsService {
  /**
   * Get main KPIs: Gross Sales, Net Sales, Total Orders, AOV, Paid, Pending, Refunded
   */
  static async getDashboardKPIs(filter: AnalyticsFilter) {
    const { restaurantId, branchId, startDate, endDate } = filter;

    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };

    if (branchId) {
      match.branchId = new Types.ObjectId(branchId);
    }

    // Bills aggregation
    const billStats = await BillModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          grossSales: { $sum: "$subtotal" },
          netSales: { $sum: "$grandTotal" },
          discounts: { $sum: "$discount" },
          tax: { $sum: "$tax" },
          paidAmount: { $sum: "$amountPaid" },
        },
      },
    ]);

    // Orders aggregation (for counts and AOV)
    const orderMatch = { ...match, status: { $nin: ["cancelled", "pending"] } };
    const orderStats = await OrderModel.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Refund and actual payment stats from Payments
    const paymentMatch = {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
      ...(branchId ? { branchId: new Types.ObjectId(branchId) } : {}), // payments might not have branchId natively, they have billId. Need to join or use bills.
    };

    // Let's use Bills for pending amount
    const pendingAmountStats = await BillModel.aggregate([
      { $match: { ...match, paymentStatus: { $in: ["pending", "partially-paid"] } } },
      {
        $group: {
          _id: null,
          pendingAmount: {
            $sum: { $subtract: ["$grandTotal", "$amountPaid"] }
          }
        }
      }
    ]);

    // For refunded amount
    const refundStats = await PaymentModel.aggregate([
      { $match: { restaurantId: new Types.ObjectId(restaurantId), status: "refunded", createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          refundedAmount: { $sum: "$refundAmount" }
        }
      }
    ]);

    const stats = billStats[0] || { grossSales: 0, netSales: 0, discounts: 0, tax: 0, paidAmount: 0 };
    const orders = orderStats[0] || { totalOrders: 0 };
    const pending = pendingAmountStats[0] || { pendingAmount: 0 };
    const refunds = refundStats[0] || { refundedAmount: 0 };

    return {
      grossSales: stats.grossSales,
      netSales: stats.netSales,
      discounts: stats.discounts,
      tax: stats.tax,
      totalOrders: orders.totalOrders,
      averageOrderValue: orders.totalOrders > 0 ? stats.netSales / orders.totalOrders : 0,
      paidAmount: stats.paidAmount,
      pendingAmount: pending.pendingAmount,
      refundedAmount: refunds.refundedAmount,
    };
  }

  static async getSalesTrend(filter: AnalyticsFilter, interval: "hourly" | "daily" | "weekly" | "monthly") {
    // Generate trend based on date groupings
    const { restaurantId, branchId, startDate, endDate } = filter;
    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };
    if (branchId) match.branchId = new Types.ObjectId(branchId);

    let formatString = "%Y-%m-%d";
    if (interval === "hourly") formatString = "%Y-%m-%d %H:00";
    if (interval === "monthly") formatString = "%Y-%m";

    const trend = await BillModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: formatString, date: "$createdAt", timezone: "Asia/Kolkata" } },
          revenue: { $sum: "$grandTotal" },
          orders: { $sum: 1 },
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    return trend.map(t => ({
      label: t._id,
      revenue: t.revenue,
      orders: t.orders,
      averageOrderValue: t.orders > 0 ? t.revenue / t.orders : 0
    }));
  }

  static async getOrderSourceBreakdown(filter: AnalyticsFilter) {
    const { restaurantId, branchId, startDate, endDate } = filter;
    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };
    if (branchId) match.branchId = new Types.ObjectId(branchId);

    return OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
          revenue: { $sum: "$grandTotal" }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  static async getPaymentMethodBreakdown(filter: AnalyticsFilter) {
    const { restaurantId, branchId, startDate, endDate } = filter;
    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };
    if (branchId) match.branchId = new Types.ObjectId(branchId);

    return BillModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amountPaid" },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]);
  }

  static async getTopItems(filter: AnalyticsFilter, limit = 10) {
    const { restaurantId, branchId, startDate, endDate } = filter;
    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };
    if (branchId) match.branchId = new Types.ObjectId(branchId);

    return BillModel.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItemId",
          name: { $first: "$items.name" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: limit }
    ]);
  }
}
