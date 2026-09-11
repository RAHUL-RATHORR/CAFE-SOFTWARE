import { Types } from "mongoose";
import { DailyClosingModel } from "@/models/closing";
import { AnalyticsService } from "@/lib/analytics";
import { BillModel, PaymentModel } from "@/models/billing";
import { OrderModel } from "@/models/order/order.model";
import { NotificationService } from "@/lib/notification/notification.service";
import { UserModel } from "@/models/user/user.model";

export class DailyClosingService {
  /**
   * Retrieves the current stats for an open day
   */
  static async getCurrentStats(restaurantId: string, branchId: string, businessDate: Date) {
    // start of business day to end of business day
    const startDate = new Date(businessDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(businessDate);
    endDate.setHours(23, 59, 59, 999);

    // Get KPIs using AnalyticsService logic
    const filter = { restaurantId, branchId, startDate, endDate };

    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      branchId: new Types.ObjectId(branchId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };

    const billStats = await BillModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          grossSales: { $sum: "$subtotal" },
          netSales: { $sum: "$grandTotal" },
          discounts: { $sum: "$discount" },
          tax: { $sum: "$tax" },
        },
      },
    ]);

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

    const cancelledOrderStats = await OrderModel.aggregate([
      { $match: { ...match, status: "cancelled" } },
      {
        $group: {
          _id: null,
          cancelledCount: { $sum: 1 },
        },
      },
    ]);

    // Payment methods breakdown
    const paymentMethods = await BillModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amountPaid" },
        }
      }
    ]);

    const refundStats = await PaymentModel.aggregate([
      { $match: { restaurantId: new Types.ObjectId(restaurantId), status: "refunded", createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          refundedAmount: { $sum: "$refundAmount" }
        }
      }
    ]);

    const stats = billStats[0] || { grossSales: 0, netSales: 0, discounts: 0, tax: 0 };
    const orders = orderStats[0] || { totalOrders: 0 };
    const cancelledOrders = cancelledOrderStats[0] || { cancelledCount: 0 };
    const refunds = refundStats[0] || { refundedAmount: 0 };

    let cashExpected = 0;
    let upiAmount = 0;
    let cardAmount = 0;
    let otherAmount = 0;

    paymentMethods.forEach(pm => {
      if (pm._id === "cash") cashExpected += pm.amount;
      else if (pm._id === "upi") upiAmount += pm.amount;
      else if (pm._id === "card") cardAmount += pm.amount;
      else otherAmount += pm.amount;
    });

    return {
      totalOrders: orders.totalOrders,
      grossSales: stats.grossSales,
      discounts: stats.discounts,
      tax: stats.tax,
      netSales: stats.netSales,
      cashExpected,
      upiAmount,
      cardAmount,
      otherAmount,
      refundAmount: refunds.refundedAmount,
      cancelledOrderCount: cancelledOrders.cancelledCount,
    };
  }

  /**
   * Finalize the daily closing
   */
  static async closeDay(params: {
    restaurantId: string;
    branchId: string;
    businessDate: Date;
    cashActual: number;
    userId: string;
  }) {
    const { restaurantId, branchId, businessDate, cashActual, userId } = params;

    const startDate = new Date(businessDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(businessDate);
    endDate.setHours(23, 59, 59, 999);

    // Check if already closed
    const existingClosing = await DailyClosingModel.findOne({
      restaurantId,
      branchId,
      businessDate: startDate,
    });

    if (existingClosing && existingClosing.status === "CLOSED") {
      throw new Error("This business day is already closed.");
    }

    const stats = await this.getCurrentStats(restaurantId, branchId, businessDate);

    const cashDifference = cashActual - stats.cashExpected;

    let resultClosing: any;

    if (existingClosing) {
      // Update existing OPEN record
      await DailyClosingModel.updateOne(
        { _id: existingClosing._id },
        {
          $set: {
            status: "CLOSED",
            closedAt: new Date(),
            closedBy: new Types.ObjectId(userId),
            totalOrders: stats.totalOrders,
            grossSales: stats.grossSales,
            discounts: stats.discounts,
            tax: stats.tax,
            netSales: stats.netSales,
            cashExpected: stats.cashExpected,
            cashActual: cashActual,
            cashDifference: cashDifference,
            upiAmount: stats.upiAmount,
            cardAmount: stats.cardAmount,
            otherAmount: stats.otherAmount,
            refundAmount: stats.refundAmount,
            cancelledOrderCount: stats.cancelledOrderCount,
          }
        }
      );
      resultClosing = await DailyClosingModel.findById(existingClosing._id);
    } else {
      // Create new closing record
      const newClosing = new DailyClosingModel({
        restaurantId: new Types.ObjectId(restaurantId),
        branchId: new Types.ObjectId(branchId),
        businessDate: startDate,
        openedAt: startDate,
        closedAt: new Date(),
        status: "CLOSED",
        closedBy: new Types.ObjectId(userId),
        totalOrders: stats.totalOrders,
        grossSales: stats.grossSales,
        discounts: stats.discounts,
        tax: stats.tax,
        netSales: stats.netSales,
        cashExpected: stats.cashExpected,
        cashActual,
        cashDifference,
        upiAmount: stats.upiAmount,
        cardAmount: stats.cardAmount,
        otherAmount: stats.otherAmount,
        refundAmount: stats.refundAmount,
        cancelledOrderCount: stats.cancelledOrderCount,
      });

      await newClosing.save();
      resultClosing = newClosing;
    }

    // Fire-and-forget notification
    (async () => {
      try {
        const owners = await UserModel.find({ restaurantId, role: "restaurant-owner" }).lean();
        for (const owner of owners) {
          await NotificationService.dispatch({
            eventType: "DAILY_CLOSING_COMPLETED",
            restaurantId,
            branchId,
            referenceKey: `DAILY_CLOSING_COMPLETED:${restaurantId}:${branchId}:${businessDate}`,
            recipient: {
              email: owner.email,
              phone: owner.phone,
              userId: owner._id.toString(),
            },
            variables: {
              businessDate,
              branchName: branchId, // in a real app we'd fetch the branch name
              netSales: stats.netSales,
              orders: stats.totalOrders,
            }
          });
        }
      } catch (e) {
        console.error("Failed to dispatch daily closing notification", e);
      }
    })();

    return resultClosing;
  }

  /**
   * Reopen a closed day (Admin only)
   */
  static async reopenDay(restaurantId: string, branchId: string, closingId: string, userId: string) {
    const closing = await DailyClosingModel.findOne({
      _id: new Types.ObjectId(closingId) as any,
      restaurantId: new Types.ObjectId(restaurantId) as any,
      branchId: new Types.ObjectId(branchId) as any,
    });

    if (!closing) throw new Error("Closing record not found");
    if (closing.status !== "CLOSED") throw new Error("Day is not closed");

    await DailyClosingModel.updateOne(
      { _id: new Types.ObjectId(closingId) as any },
      {
        $set: {
          status: "OPEN",
          closedAt: null,
          closedBy: null,
        }
      }
    );
    
    // In a real app, an audit log should be created here

    return DailyClosingModel.findById(closingId);
  }
}
