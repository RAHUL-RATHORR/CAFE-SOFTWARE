import { Types } from "mongoose";
import { OrderModel } from "@/models/order";
import { BillModel, PaymentModel } from "@/models/billing";
import { DailyClosingModel } from "@/models/closing";
import { StockMovementModel } from "@/models/inventory";
import { AnalyticsService } from "@/lib/analytics/analytics.service";

export interface ReportFilter {
  restaurantId: string;
  branchId?: string;
  startDate: Date;
  endDate: Date;
  page?: number;
  limit?: number;
  [key: string]: any;
}

export class ReportsService {
  /**
   * Retrieves summary sales data reconciling with Analytics Dashboard
   */
  static async getSalesSummary(filter: ReportFilter) {
    const kpis = await AnalyticsService.getDashboardKPIs({
      restaurantId: filter.restaurantId,
      branchId: filter.branchId,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });
    
    return [
      {
        businessDate: filter.startDate.toISOString().split("T")[0] + " to " + filter.endDate.toISOString().split("T")[0],
        branch: filter.branchId || "All Branches",
        orders: kpis.totalOrders,
        grossSales: kpis.grossSales,
        discount: kpis.discounts,
        tax: kpis.tax,
        netSales: kpis.netSales,
        refunds: kpis.refundedAmount,
        paidAmount: kpis.paidAmount,
        outstandingAmount: kpis.pendingAmount,
      }
    ];
  }

  /**
   * Detailed Sales / Order Report
   */
  static async getOrderReport(filter: ReportFilter) {
    const { restaurantId, branchId, startDate, endDate, page = 1, limit = 50 } = filter;
    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };
    if (branchId) match.branchId = new Types.ObjectId(branchId);

    const orders = await OrderModel.find(match)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("branchId", "name")
      .lean();

    const totalCount = await OrderModel.countDocuments(match);

    const data = orders.map((o: any) => ({
      orderNumber: o.orderNumber,
      dateTime: o.createdAt.toISOString(),
      branch: o.branchId?.name || "N/A",
      orderType: o.type,
      orderSource: o.source,
      itemsCount: o.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      subtotal: o.subtotal,
      discount: o.discount,
      tax: o.tax,
      total: o.grandTotal,
      paymentStatus: o.paymentStatus,
      orderStatus: o.status,
    }));

    return { data, totalCount, page, limit };
  }

  /**
   * Payment Report
   */
  static async getPaymentReport(filter: ReportFilter) {
    const { restaurantId, branchId, startDate, endDate, page = 1, limit = 50 } = filter;
    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };
    if (branchId) match.branchId = new Types.ObjectId(branchId);

    const payments = await PaymentModel.find(match)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("billId", "invoiceNumber")
      .populate("orderId", "orderNumber")
      .lean();

    const totalCount = await PaymentModel.countDocuments(match);

    const data = payments.map((p: any) => ({
      paymentDate: p.createdAt.toISOString(),
      orderNumber: p.orderId?.orderNumber || "N/A",
      invoiceNumber: p.billId?.invoiceNumber || "N/A",
      paymentMethod: p.method,
      amount: p.amount,
      paymentStatus: p.status,
      refundAmount: p.refundAmount || 0,
      reference: p.referenceId || "",
    }));

    return { data, totalCount, page, limit };
  }

  /**
   * GST / Tax Report
   */
  static async getTaxReport(filter: ReportFilter) {
    const { restaurantId, branchId, startDate, endDate, page = 1, limit = 50 } = filter;
    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
      "taxBreakdown.0": { $exists: true }, // Only bills with tax
    };
    if (branchId) match.branchId = new Types.ObjectId(branchId);

    const bills = await BillModel.find(match)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalCount = await BillModel.countDocuments(match);

    const data = bills.map((b: any) => {
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      
      b.taxBreakdown?.forEach((tb: any) => {
        if (tb.taxName.toUpperCase().includes("CGST")) cgst += tb.amount;
        else if (tb.taxName.toUpperCase().includes("SGST")) sgst += tb.amount;
        else if (tb.taxName.toUpperCase().includes("IGST")) igst += tb.amount;
      });

      return {
        invoiceNumber: b.invoiceNumber,
        invoiceDate: b.createdAt.toISOString(),
        customerName: b.customerName || "N/A",
        taxableAmount: b.subtotal - b.discount,
        cgst,
        sgst,
        igst,
        totalTax: b.tax,
        invoiceTotal: b.grandTotal,
      };
    });

    return { data, totalCount, page, limit };
  }

  /**
   * Stock Movement Report
   */
  static async getStockMovementReport(filter: ReportFilter) {
    const { restaurantId, branchId, startDate, endDate, page = 1, limit = 50 } = filter;
    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      date: { $gte: startDate, $lte: endDate },
    };
    if (branchId) match.branchId = new Types.ObjectId(branchId);

    const movements = await StockMovementModel.find(match)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("ingredientId", "name unit")
      .populate("branchId", "name")
      .populate("userId", "name")
      .lean();

    const totalCount = await StockMovementModel.countDocuments(match);

    const data = movements.map((m: any) => ({
      date: m.date.toISOString(),
      ingredient: m.ingredientId?.name || "N/A",
      branch: m.branchId?.name || "N/A",
      movementType: m.type,
      quantity: m.quantity,
      unit: m.ingredientId?.unit || "",
      beforeStock: m.balanceBefore,
      afterStock: m.balanceAfter,
      reference: m.reference || "",
      user: m.userId?.name || "System",
    }));

    return { data, totalCount, page, limit };
  }

  /**
   * Menu Performance Report
   */
  static async getMenuPerformanceReport(filter: ReportFilter) {
    const topItems = await AnalyticsService.getTopItems({
      restaurantId: filter.restaurantId,
      branchId: filter.branchId,
      startDate: filter.startDate,
      endDate: filter.endDate,
    }, 100);

    return {
      data: topItems.map(item => ({
        item: item.name,
        quantitySold: item.quantitySold,
        revenue: item.revenue,
      })),
      totalCount: topItems.length,
      page: 1,
      limit: 100
    };
  }

  /**
   * Daily Closing Report
   */
  static async getDailyClosingReport(filter: ReportFilter) {
    const { restaurantId, branchId, startDate, endDate, page = 1, limit = 50 } = filter;
    const match: any = {
      restaurantId: new Types.ObjectId(restaurantId),
      businessDate: { $gte: startDate, $lte: endDate },
    };
    if (branchId) match.branchId = new Types.ObjectId(branchId);

    const closings = await DailyClosingModel.find(match)
      .sort({ businessDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("branchId", "name")
      .populate("closedBy", "name")
      .lean();

    const totalCount = await DailyClosingModel.countDocuments(match);

    const data = closings.map((c: any) => ({
      businessDate: c.businessDate.toISOString().split("T")[0],
      branch: c.branchId?.name || "N/A",
      totalOrders: c.totalOrders,
      grossSales: c.grossSales,
      discount: c.totalDiscount,
      tax: c.totalTax,
      netSales: c.netSales,
      cashExpected: c.cashExpected,
      cashActual: c.cashActual,
      cashDifference: c.cashDifference,
      closedBy: c.closedBy?.name || "N/A",
      closedAt: c.closedAt ? c.closedAt.toISOString() : "",
      status: c.status,
    }));

    return { data, totalCount, page, limit };
  }
}
