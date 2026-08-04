import {
  buildPaginationMeta,
  connectToDatabase,
  isValidObjectId,
  normalizePagination,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import {
  buildTrend,
  formatReportMoney,
  formatReportNumber,
  resolveReportDateRange,
} from "@/lib/reports";
import { OrderModel } from "@/models/order";
import { BillModel, PaymentModel } from "@/models/billing";
import { CustomerModel } from "@/models/customer";
import { PurchaseOrderModel } from "@/models/purchase";
import { IngredientModel } from "@/models/inventory";
import { UserModel } from "@/models/user";
import { EmployeeModel } from "@/models/staff";
import type { ReportFiltersInput } from "@/lib/validators/report";
import type {
  ExecutiveDashboardData,
  ModuleReportData,
  ReportChartPoint,
  ReportKpi,
  ReportNamedValue,
  ReportTableResult,
} from "@/types/report";

type Filter = Record<string, unknown>;

function tenantFilter(restaurantId: string, extra: Filter = {}): Filter {
  return notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
    ...extra,
  });
}

function dateMatch(from: Date, to: Date): Filter {
  return { createdAt: { $gte: from, $lte: to } };
}

function previousPeriod(from: Date, to: Date) {
  const duration = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);
  return { from: prevFrom, to: prevTo };
}

function shiftDayLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

async function sumField(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: { aggregate: (...args: any[]) => { exec: () => Promise<Array<{ total: number }>> } },
  match: Filter,
  field: string
): Promise<number> {
  const rows = await model
    .aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: `$${field}` } } },
    ])
    .exec();
  return Number(rows[0]?.total ?? 0);
}

async function countDocs(
  model: { countDocuments: (match: Filter) => Promise<number> },
  match: Filter
): Promise<number> {
  return model.countDocuments(match);
}

function emptyTable(page = 1, pageSize = 10): ReportTableResult {
  return {
    columns: [],
    rows: [],
    meta: buildPaginationMeta(0, page, pageSize),
  };
}

async function getExecutiveDashboard(
  restaurantId: string,
  input: ReportFiltersInput
): Promise<ExecutiveDashboardData> {
  await connectToDatabase();
  const range = resolveReportDateRange(input);
  const prev = previousPeriod(range.from, range.to);
  const base = tenantFilter(restaurantId);
  const currentMatch = { ...base, ...dateMatch(range.from, range.to) };
  const previousMatch = { ...base, ...dateMatch(prev.from, prev.to) };
  const today = resolveReportDateRange({ preset: "today" });
  const month = resolveReportDateRange({ preset: "month" });

  const completedStatuses = ["completed", "served"];
  const revenueMatch = {
    ...currentMatch,
    status: { $in: completedStatuses },
  };
  const prevRevenueMatch = {
    ...previousMatch,
    status: { $in: completedStatuses },
  };

  const [
    grossSales,
    prevGross,
    ordersToday,
    ordersMonth,
    ordersInRange,
    prevOrders,
    activeCustomers,
    newCustomers,
    inventoryDocs,
    purchaseCost,
    prevPurchaseCost,
    paymentsPaid,
    recentOrders,
    recentPayments,
    recentPurchases,
    lowStock,
    topItemsAgg,
    topCustomersAgg,
    statusAgg,
    typeAgg,
    kitchenAgg,
  ] = await Promise.all([
    sumField(OrderModel, revenueMatch, "grandTotal"),
    sumField(OrderModel, prevRevenueMatch, "grandTotal"),
    countDocs(OrderModel, {
      ...base,
      ...dateMatch(today.from, today.to),
    }),
    countDocs(OrderModel, {
      ...base,
      ...dateMatch(month.from, month.to),
    }),
    countDocs(OrderModel, currentMatch),
    countDocs(OrderModel, previousMatch),
    countDocs(CustomerModel, {
      ...base,
      status: { $in: ["active", "vip"] },
    }),
    countDocs(CustomerModel, {
      ...base,
      ...dateMatch(range.from, range.to),
    }),
    IngredientModel.find({
      ...base,
      status: "active",
    } as Filter)
      .select({ name: 1, currentStock: 1, reorderLevel: 1 })
      .lean()
      .exec(),
    sumField(PurchaseOrderModel, {
      ...currentMatch,
      status: { $nin: ["cancelled", "draft"] },
    }, "grandTotal"),
    sumField(PurchaseOrderModel, {
      ...previousMatch,
      status: { $nin: ["cancelled", "draft"] },
    }, "grandTotal"),
    sumField(PaymentModel, {
      ...tenantFilter(restaurantId),
      ...dateMatch(range.from, range.to),
      status: "completed",
    }, "amount"),
    OrderModel.find(currentMatch as Filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select({ orderNumber: 1, grandTotal: 1, createdAt: 1 })
      .lean()
      .exec(),
    PaymentModel.find({
      ...tenantFilter(restaurantId),
      ...dateMatch(range.from, range.to),
    } as Filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select({ amount: 1, method: 1, createdAt: 1 })
      .lean()
      .exec(),
    PurchaseOrderModel.find(currentMatch as Filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select({ purchaseNumber: 1, grandTotal: 1, createdAt: 1 })
      .lean()
      .exec(),
    IngredientModel.find({
      ...base,
      $expr: { $lte: ["$currentStock", "$reorderLevel"] },
      status: "active",
    } as Filter)
      .sort({ currentStock: 1 })
      .limit(6)
      .select({ name: 1, currentStock: 1, unit: 1, reorderLevel: 1 })
      .lean()
      .exec(),
    OrderModel.aggregate<{ _id: string; qty: number; revenue: number }>([
      { $match: revenueMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          qty: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 6 },
    ]).exec(),
    CustomerModel.find({
      ...base,
      totalSpent: { $gt: 0 },
    } as Filter)
      .sort({ totalSpent: -1 })
      .limit(6)
      .select({ fullName: 1, totalSpent: 1, totalOrders: 1 })
      .lean()
      .exec(),
    OrderModel.aggregate<{ _id: string; count: number }>([
      { $match: currentMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).exec(),
    OrderModel.aggregate<{ _id: string; total: number }>([
      { $match: revenueMatch },
      { $group: { _id: "$orderType", total: { $sum: "$grandTotal" } } },
      { $sort: { total: -1 } },
    ]).exec(),
    OrderModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          ...currentMatch,
          status: {
            $in: ["preparing", "ready", "served", "completed"],
          },
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
  ]);

  const inventoryValue = inventoryDocs.reduce(
    (sum, item) => sum + Number(item.currentStock ?? 0),
    0
  );
  const lowStockCount = lowStock.length;
  const aov = ordersInRange > 0 ? grossSales / ordersInRange : 0;
  const taxCollected = await sumField(OrderModel, revenueMatch, "tax");
  const netRevenue = Math.max(0, grossSales - taxCollected * 0); // tax already in order; net ≈ paid
  const netApprox = Math.max(0, paymentsPaid || grossSales - purchaseCost * 0.1);

  const dayBuckets: ReportChartPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const dayTotal = await sumField(
      OrderModel,
      {
        ...base,
        ...dateMatch(dayStart, dayEnd),
        status: { $in: completedStatuses },
      },
      "grandTotal"
    );
    dayBuckets.push({ label: shiftDayLabel(dayStart), value: dayTotal });
  }

  const kpis: ReportKpi[] = [
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: formatReportMoney(grossSales),
      accent: "success",
      trend: buildTrend(grossSales, prevGross),
      description: range.label,
    },
    {
      id: "net-revenue",
      title: "Net Revenue",
      value: formatReportMoney(netApprox || netRevenue || grossSales),
      accent: "primary",
      description: "Paid / settled estimate",
    },
    {
      id: "gross-sales",
      title: "Gross Sales",
      value: formatReportMoney(grossSales),
      accent: "primary",
    },
    {
      id: "orders-today",
      title: "Orders Today",
      value: formatReportNumber(ordersToday),
      accent: "warning",
    },
    {
      id: "orders-month",
      title: "Orders This Month",
      value: formatReportNumber(ordersMonth),
      accent: "warning",
    },
    {
      id: "aov",
      title: "Average Order Value",
      value: formatReportMoney(aov),
      accent: "primary",
      trend: buildTrend(
        aov,
        prevOrders > 0 ? prevGross / prevOrders : 0
      ),
    },
    {
      id: "active-customers",
      title: "Active Customers",
      value: formatReportNumber(activeCustomers),
      accent: "success",
    },
    {
      id: "new-customers",
      title: "New Customers",
      value: formatReportNumber(newCustomers),
      accent: "success",
      description: range.label,
    },
    {
      id: "inventory-value",
      title: "Inventory Value",
      value: formatReportNumber(inventoryValue),
      description: "Stock units (foundation)",
      accent: "primary",
    },
    {
      id: "low-stock",
      title: "Low Stock Items",
      value: formatReportNumber(lowStockCount),
      accent: lowStockCount > 0 ? "danger" : "success",
    },
    {
      id: "purchase-cost",
      title: "Purchase Cost",
      value: formatReportMoney(purchaseCost),
      accent: "warning",
      trend: buildTrend(purchaseCost, prevPurchaseCost),
    },
    {
      id: "profit-placeholder",
      title: "Profit Placeholder",
      value: formatReportMoney(Math.max(0, grossSales - purchaseCost)),
      description: "Sales − purchases (placeholder)",
      accent: "success",
    },
  ];

  const topCategories: ReportNamedValue[] = typeAgg.map((row) => ({
    id: String(row._id),
    label: String(row._id),
    value: Number(row.total ?? 0),
    meta: formatReportMoney(Number(row.total ?? 0)),
  }));

  return {
    kpis,
    revenueTrend: dayBuckets,
    ordersByStatus: statusAgg.map((row) => ({
      label: String(row._id),
      value: Number(row.count ?? 0),
    })),
    salesByOrderType: typeAgg.map((row) => ({
      label: String(row._id),
      value: Number(row.total ?? 0),
    })),
    topSellingItems: topItemsAgg.map((row, index) => ({
      id: `item-${index}`,
      label: row._id || "Item",
      value: Number(row.qty ?? 0),
      meta: formatReportMoney(Number(row.revenue ?? 0)),
    })),
    topCustomers: topCustomersAgg.map((customer) => ({
      id: String(customer._id),
      label: customer.fullName,
      value: Number(customer.totalSpent ?? 0),
      meta: `${customer.totalOrders ?? 0} orders`,
    })),
    topCategories,
    recentSales: recentOrders.map((order) => ({
      id: String(order._id),
      label: order.orderNumber,
      value: Number(order.grandTotal ?? 0),
      meta: order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : undefined,
    })),
    recentPayments: recentPayments.map((payment) => ({
      id: String(payment._id),
      label: String(payment.method ?? "payment"),
      value: Number(payment.amount ?? 0),
      meta: payment.createdAt
        ? new Date(payment.createdAt).toLocaleString()
        : undefined,
    })),
    recentPurchases: recentPurchases.map((purchase) => ({
      id: String(purchase._id),
      label: purchase.purchaseNumber,
      value: Number(purchase.grandTotal ?? 0),
      meta: purchase.createdAt
        ? new Date(purchase.createdAt).toLocaleString()
        : undefined,
    })),
    lowStockItems: lowStock.map((item) => ({
      id: String(item._id),
      label: item.name,
      value: Number(item.currentStock ?? 0),
      meta: `Reorder at ${item.reorderLevel ?? 0} ${item.unit ?? ""}`,
    })),
    kitchenPerformance: kitchenAgg.map((row) => ({
      label: String(row._id),
      value: Number(row.count ?? 0),
    })),
  };
}

async function getModuleReport(
  restaurantId: string,
  kind: ModuleReportData["kind"],
  input: ReportFiltersInput
): Promise<ModuleReportData> {
  await connectToDatabase();
  const range = resolveReportDateRange(input);
  const pagination = normalizePagination({
    page: input.page,
    pageSize: input.pageSize,
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
  });
  const skip = (pagination.page - 1) * pagination.pageSize;
  const base = tenantFilter(restaurantId);
  const match: Filter = {
    ...base,
    ...dateMatch(range.from, range.to),
  };

  if (input.branchId && isValidObjectId(input.branchId)) {
    match.branchId = toObjectId(input.branchId);
  }
  if (input.customerId && isValidObjectId(input.customerId)) {
    match.customerId = toObjectId(input.customerId);
  }
  if (input.orderType) match.orderType = input.orderType;
  if (input.orderStatus) match.status = input.orderStatus;
  if (input.paymentMethod) match.paymentMethod = input.paymentMethod;

  if (kind === "sales" || kind === "orders" || kind === "revenue") {
    const revenueMatch = {
      ...match,
      status: input.orderStatus
        ? input.orderStatus
        : { $in: ["completed", "served"] },
    };
    const [totalOrders, gross, tax, discount, statusAgg, typeAgg, docs, total] =
      await Promise.all([
        countDocs(OrderModel, match),
        sumField(OrderModel, revenueMatch as Filter, "grandTotal"),
        sumField(OrderModel, revenueMatch as Filter, "tax"),
        sumField(OrderModel, revenueMatch as Filter, "discount"),
        OrderModel.aggregate<{ _id: string; count: number; total: number }>([
          { $match: match },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              total: { $sum: "$grandTotal" },
            },
          },
        ]).exec(),
        OrderModel.aggregate<{ _id: string; total: number }>([
          { $match: revenueMatch as Filter },
          { $group: { _id: "$orderType", total: { $sum: "$grandTotal" } } },
        ]).exec(),
        OrderModel.find(match as Filter)
          .sort({
            [pagination.sortBy || "createdAt"]:
              pagination.sortOrder === "asc" ? 1 : -1,
          })
          .skip(skip)
          .limit(pagination.pageSize)
          .select({
            orderNumber: 1,
            status: 1,
            orderType: 1,
            grandTotal: 1,
            tax: 1,
            discount: 1,
            createdAt: 1,
          })
          .lean()
          .exec(),
        countDocs(OrderModel, match),
      ]);

    const aov = totalOrders > 0 ? gross / totalOrders : 0;

    return {
      kind,
      title:
        kind === "sales"
          ? "Sales Report"
          : kind === "orders"
            ? "Orders Report"
            : "Revenue Report",
      description: `${range.label} · operational analytics`,
      kpis: [
        {
          id: "gross",
          title: "Gross Sales",
          value: formatReportMoney(gross),
          accent: "success",
        },
        {
          id: "orders",
          title: "Orders",
          value: formatReportNumber(totalOrders),
          accent: "warning",
        },
        {
          id: "aov",
          title: "AOV",
          value: formatReportMoney(aov),
          accent: "primary",
        },
        {
          id: "tax",
          title: "Tax",
          value: formatReportMoney(tax),
          accent: "primary",
        },
        {
          id: "discount",
          title: "Discounts",
          value: formatReportMoney(discount),
          accent: "danger",
        },
        {
          id: "net",
          title: "Net (placeholder)",
          value: formatReportMoney(Math.max(0, gross - discount)),
          accent: "success",
        },
      ],
      charts: [
        {
          id: "by-status",
          title: "Orders by status",
          type: "donut",
          points: statusAgg.map((row) => ({
            label: String(row._id),
            value: Number(row.count ?? 0),
          })),
        },
        {
          id: "by-type",
          title: "Sales by order type",
          type: "bar",
          points: typeAgg.map((row) => ({
            label: String(row._id),
            value: Number(row.total ?? 0),
          })),
        },
        {
          id: "revenue-bars",
          title: "Status revenue",
          type: "area",
          points: statusAgg.map((row) => ({
            label: String(row._id),
            value: Number(row.total ?? 0),
          })),
        },
      ],
      table: {
        columns: [
          { key: "orderNumber", label: "Order" },
          { key: "status", label: "Status" },
          { key: "orderType", label: "Type" },
          { key: "grandTotal", label: "Total", align: "right" },
          { key: "createdAt", label: "Created" },
        ],
        rows: docs.map((doc) => ({
          orderNumber: doc.orderNumber,
          status: doc.status,
          orderType: doc.orderType,
          grandTotal: formatReportMoney(Number(doc.grandTotal ?? 0)),
          createdAt: doc.createdAt
            ? new Date(doc.createdAt).toLocaleString()
            : "—",
        })),
        meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
        totals: {
          orders: total,
          gross: formatReportMoney(gross),
        },
      },
      summary: statusAgg.map((row) => ({
        id: String(row._id),
        label: String(row._id),
        value: Number(row.count ?? 0),
        meta: formatReportMoney(Number(row.total ?? 0)),
      })),
    };
  }

  if (kind === "customers") {
    const customerMatch = { ...base };
    if (input.q) {
      const regex = new RegExp(
        input.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      customerMatch.$or = [
        { fullName: regex },
        { phone: regex },
        { email: regex },
      ];
    }
    const [active, vip, newCount, docs, total, spendAgg] = await Promise.all([
      countDocs(CustomerModel, { ...base, status: "active" }),
      countDocs(CustomerModel, { ...base, status: "vip" }),
      countDocs(CustomerModel, {
        ...base,
        ...dateMatch(range.from, range.to),
      }),
      CustomerModel.find(customerMatch as Filter)
        .sort({ totalSpent: -1 })
        .skip(skip)
        .limit(pagination.pageSize)
        .select({
          fullName: 1,
          phone: 1,
          status: 1,
          totalOrders: 1,
          totalSpent: 1,
          lastVisit: 1,
        })
        .lean()
        .exec(),
      countDocs(CustomerModel, customerMatch),
      CustomerModel.aggregate<{ _id: string; total: number; count: number }>([
        { $match: base },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$totalSpent" },
            count: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    return {
      kind,
      title: "Customer Report",
      description: "Guest growth, loyalty, and spend",
      kpis: [
        {
          id: "active",
          title: "Active Customers",
          value: formatReportNumber(active),
          accent: "success",
        },
        {
          id: "vip",
          title: "VIP",
          value: formatReportNumber(vip),
          accent: "warning",
        },
        {
          id: "new",
          title: "New in range",
          value: formatReportNumber(newCount),
          accent: "primary",
        },
        {
          id: "total",
          title: "Total profiles",
          value: formatReportNumber(total),
          accent: "primary",
        },
      ],
      charts: [
        {
          id: "by-status",
          title: "Customers by status",
          type: "pie",
          points: spendAgg.map((row) => ({
            label: String(row._id),
            value: Number(row.count ?? 0),
          })),
        },
        {
          id: "spend",
          title: "Spend by status",
          type: "bar",
          points: spendAgg.map((row) => ({
            label: String(row._id),
            value: Number(row.total ?? 0),
          })),
        },
      ],
      table: {
        columns: [
          { key: "fullName", label: "Customer" },
          { key: "phone", label: "Phone" },
          { key: "status", label: "Status" },
          { key: "totalOrders", label: "Orders", align: "right" },
          { key: "totalSpent", label: "Spent", align: "right" },
        ],
        rows: docs.map((doc) => ({
          fullName: doc.fullName,
          phone: doc.phone,
          status: doc.status,
          totalOrders: Number(doc.totalOrders ?? 0),
          totalSpent: formatReportMoney(Number(doc.totalSpent ?? 0)),
        })),
        meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
      },
      summary: spendAgg.map((row) => ({
        id: String(row._id),
        label: String(row._id),
        value: Number(row.count ?? 0),
        meta: formatReportMoney(Number(row.total ?? 0)),
      })),
    };
  }

  if (kind === "inventory") {
    const [docs, total, lowCount, units] = await Promise.all([
      IngredientModel.find(base as Filter)
        .sort({ currentStock: 1 })
        .skip(skip)
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      countDocs(IngredientModel, base),
      countDocs(IngredientModel, {
        ...base,
        $expr: { $lte: ["$currentStock", "$reorderLevel"] },
      } as Filter),
      IngredientModel.aggregate<{ _id: string; stock: number }>([
        { $match: base },
        { $group: { _id: "$unit", stock: { $sum: "$currentStock" } } },
      ]).exec(),
    ]);
    const stockValue = docs.reduce(
      (sum, item) => sum + Number(item.currentStock ?? 0),
      0
    );

    return {
      kind,
      title: "Inventory Report",
      description: "Stock levels and low-stock foundation",
      kpis: [
        {
          id: "items",
          title: "Ingredients",
          value: formatReportNumber(total),
          accent: "primary",
        },
        {
          id: "low",
          title: "Low stock",
          value: formatReportNumber(lowCount),
          accent: "danger",
        },
        {
          id: "units",
          title: "Units on hand (page)",
          value: formatReportNumber(stockValue),
          accent: "success",
        },
      ],
      charts: [
        {
          id: "by-unit",
          title: "Stock by unit",
          type: "bar",
          points: units.map((row) => ({
            label: String(row._id),
            value: Number(row.stock ?? 0),
          })),
        },
        {
          id: "heatmap-placeholder",
          title: "Heatmap placeholder",
          type: "line",
          points: units.map((row) => ({
            label: String(row._id),
            value: Number(row.stock ?? 0),
          })),
        },
      ],
      table: {
        columns: [
          { key: "name", label: "Ingredient" },
          { key: "unit", label: "Unit" },
          { key: "currentStock", label: "Stock", align: "right" },
          { key: "reorderLevel", label: "Reorder", align: "right" },
          { key: "status", label: "Status" },
        ],
        rows: docs.map((doc) => ({
          name: doc.name,
          unit: doc.unit,
          currentStock: Number(doc.currentStock ?? 0),
          reorderLevel: Number(doc.reorderLevel ?? 0),
          status: doc.status,
        })),
        meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
      },
      summary: [
        {
          id: "low-stock",
          label: "Low stock items",
          value: lowCount,
        },
      ],
    };
  }

  if (kind === "purchases") {
    const [docs, total, spend, statusAgg] = await Promise.all([
      PurchaseOrderModel.find(match as Filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.pageSize)
        .select({
          purchaseNumber: 1,
          status: 1,
          grandTotal: 1,
          createdAt: 1,
        })
        .lean()
        .exec(),
      countDocs(PurchaseOrderModel, match),
      sumField(PurchaseOrderModel, {
        ...match,
        status: { $nin: ["cancelled", "draft"] },
      }, "grandTotal"),
      PurchaseOrderModel.aggregate<{ _id: string; count: number; total: number }>([
        { $match: match },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            total: { $sum: "$grandTotal" },
          },
        },
      ]).exec(),
    ]);

    return {
      kind,
      title: "Purchase Report",
      description: "Vendor spend and PO workflow",
      kpis: [
        {
          id: "spend",
          title: "Purchase cost",
          value: formatReportMoney(spend),
          accent: "warning",
        },
        {
          id: "pos",
          title: "Purchase orders",
          value: formatReportNumber(total),
          accent: "primary",
        },
      ],
      charts: [
        {
          id: "by-status",
          title: "POs by status",
          type: "donut",
          points: statusAgg.map((row) => ({
            label: String(row._id),
            value: Number(row.count ?? 0),
          })),
        },
        {
          id: "spend-status",
          title: "Spend by status",
          type: "bar",
          points: statusAgg.map((row) => ({
            label: String(row._id),
            value: Number(row.total ?? 0),
          })),
        },
      ],
      table: {
        columns: [
          { key: "purchaseNumber", label: "PO #" },
          { key: "status", label: "Status" },
          { key: "grandTotal", label: "Total", align: "right" },
          { key: "createdAt", label: "Created" },
        ],
        rows: docs.map((doc) => ({
          purchaseNumber: doc.purchaseNumber,
          status: doc.status,
          grandTotal: formatReportMoney(Number(doc.grandTotal ?? 0)),
          createdAt: doc.createdAt
            ? new Date(doc.createdAt).toLocaleString()
            : "—",
        })),
        meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
      },
      summary: statusAgg.map((row) => ({
        id: String(row._id),
        label: String(row._id),
        value: Number(row.count ?? 0),
        meta: formatReportMoney(Number(row.total ?? 0)),
      })),
    };
  }

  if (kind === "kitchen") {
    const kitchenMatch = {
      ...match,
      status: {
        $in: ["confirmed", "preparing", "ready", "served", "completed"],
      },
    };
    const [statusAgg, chefAgg, total] = await Promise.all([
      OrderModel.aggregate<{ _id: string; count: number }>([
        { $match: kitchenMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).exec(),
      OrderModel.aggregate<{ _id: unknown; count: number }>([
        {
          $match: {
            ...kitchenMatch,
            assignedChefId: { $ne: null },
          },
        },
        { $group: { _id: "$assignedChefId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]).exec(),
      countDocs(OrderModel, kitchenMatch),
    ]);

    return {
      kind,
      title: "Kitchen Report",
      description: "Ticket flow and chef assignment",
      kpis: [
        {
          id: "tickets",
          title: "Kitchen tickets",
          value: formatReportNumber(total),
          accent: "warning",
        },
        {
          id: "preparing",
          title: "Preparing",
          value: formatReportNumber(
            Number(
              statusAgg.find((row) => row._id === "preparing")?.count ?? 0
            )
          ),
          accent: "danger",
        },
        {
          id: "ready",
          title: "Ready",
          value: formatReportNumber(
            Number(statusAgg.find((row) => row._id === "ready")?.count ?? 0)
          ),
          accent: "success",
        },
      ],
      charts: [
        {
          id: "flow",
          title: "Kitchen status flow",
          type: "bar",
          points: statusAgg.map((row) => ({
            label: String(row._id),
            value: Number(row.count ?? 0),
          })),
        },
        {
          id: "chefs",
          title: "Tickets by chef",
          type: "line",
          points: chefAgg.map((row, index) => ({
            label: `Chef ${index + 1}`,
            value: Number(row.count ?? 0),
          })),
        },
      ],
      table: emptyTable(pagination.page, pagination.pageSize),
      summary: statusAgg.map((row) => ({
        id: String(row._id),
        label: String(row._id),
        value: Number(row.count ?? 0),
      })),
    };
  }

  if (kind === "staff") {
    const userFilter: Filter = { ...base };
    const employeeFilter: Filter = tenantFilter(restaurantId);

    if (input.employeeId && isValidObjectId(input.employeeId)) {
      employeeFilter._id = toObjectId(input.employeeId);
      const linked = await EmployeeModel.findOne(employeeFilter as Filter)
        .select({ userId: 1 })
        .lean()
        .exec();
      if (linked?.userId) {
        userFilter._id = linked.userId;
      }
    }

    const [users, employeeCount, chefAgg, cashierAgg] = await Promise.all([
      UserModel.find(userFilter as Filter)
        .select({ name: 1, role: 1, status: 1, lastLogin: 1 })
        .limit(50)
        .lean()
        .exec(),
      countDocs(EmployeeModel, employeeFilter),
      OrderModel.aggregate<{ _id: unknown; count: number; total: number }>([
        {
          $match: {
            ...match,
            assignedChefId: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$assignedChefId",
            count: { $sum: 1 },
            total: { $sum: "$grandTotal" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).exec(),
      BillModel.aggregate<{ _id: unknown; count: number; total: number }>([
        {
          $match: {
            ...tenantFilter(restaurantId),
            ...dateMatch(range.from, range.to),
            cashierId: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$cashierId",
            count: { $sum: 1 },
            total: { $sum: "$grandTotal" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).exec(),
    ]);

    return {
      kind,
      title: "Staff Performance Report",
      description:
        "Employee directory plus chef/cashier activity (User-based ops)",
      kpis: [
        {
          id: "employees",
          title: "Employees",
          value: formatReportNumber(employeeCount),
          accent: "primary",
        },
        {
          id: "staff",
          title: "Staff users",
          value: formatReportNumber(users.length),
          accent: "warning",
        },
        {
          id: "chefs",
          title: "Active chefs (orders)",
          value: formatReportNumber(chefAgg.length),
          accent: "warning",
        },
        {
          id: "cashiers",
          title: "Active cashiers (bills)",
          value: formatReportNumber(cashierAgg.length),
          accent: "success",
        },
      ],
      charts: [
        {
          id: "chef-orders",
          title: "Orders by chef",
          type: "bar",
          points: chefAgg.map((row, index) => ({
            label: `Chef ${index + 1}`,
            value: Number(row.count ?? 0),
          })),
        },
        {
          id: "cashier-bills",
          title: "Bills by cashier",
          type: "donut",
          points: cashierAgg.map((row, index) => ({
            label: `Cashier ${index + 1}`,
            value: Number(row.count ?? 0),
          })),
        },
      ],
      table: {
        columns: [
          { key: "name", label: "Name" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" },
          { key: "lastLogin", label: "Last login" },
        ],
        rows: users.slice(skip, skip + pagination.pageSize).map((user) => ({
          name: user.name,
          role: user.role,
          status: user.status,
          lastLogin: user.lastLogin
            ? new Date(user.lastLogin).toLocaleString()
            : "—",
        })),
        meta: buildPaginationMeta(
          users.length,
          pagination.page,
          pagination.pageSize
        ),
      },
      summary: [
        ...chefAgg.slice(0, 3).map((row, index) => ({
          id: `chef-${index}`,
          label: `Chef ${index + 1}`,
          value: Number(row.count ?? 0),
          meta: formatReportMoney(Number(row.total ?? 0)),
        })),
      ],
    };
  }

  if (kind === "payments") {
    const paymentMatch = {
      ...tenantFilter(restaurantId),
      ...dateMatch(range.from, range.to),
    };
    if (input.paymentMethod) paymentMatch.method = input.paymentMethod;

    const [docs, total, amount, methodAgg] = await Promise.all([
      PaymentModel.find(paymentMatch as Filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      countDocs(PaymentModel, paymentMatch),
      sumField(PaymentModel, {
        ...paymentMatch,
        status: "completed",
      }, "amount"),
      PaymentModel.aggregate<{ _id: string; total: number; count: number }>([
        { $match: paymentMatch },
        {
          $group: {
            _id: "$method",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    return {
      kind,
      title: "Payment Summary",
      description: "Settlement methods and totals",
      kpis: [
        {
          id: "collected",
          title: "Collected",
          value: formatReportMoney(amount),
          accent: "success",
        },
        {
          id: "payments",
          title: "Payments",
          value: formatReportNumber(total),
          accent: "primary",
        },
      ],
      charts: [
        {
          id: "by-method",
          title: "By payment method",
          type: "pie",
          points: methodAgg.map((row) => ({
            label: String(row._id || "unknown"),
            value: Number(row.total ?? 0),
          })),
        },
        {
          id: "count-method",
          title: "Payment count",
          type: "bar",
          points: methodAgg.map((row) => ({
            label: String(row._id || "unknown"),
            value: Number(row.count ?? 0),
          })),
        },
      ],
      table: {
        columns: [
          { key: "method", label: "Method" },
          { key: "status", label: "Status" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "createdAt", label: "Created" },
        ],
        rows: docs.map((doc) => ({
          method: String(doc.method ?? "—"),
          status: String(doc.status ?? "—"),
          amount: formatReportMoney(Number(doc.amount ?? 0)),
          createdAt: doc.createdAt
            ? new Date(doc.createdAt).toLocaleString()
            : "—",
        })),
        meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
      },
      summary: methodAgg.map((row) => ({
        id: String(row._id),
        label: String(row._id || "unknown"),
        value: Number(row.count ?? 0),
        meta: formatReportMoney(Number(row.total ?? 0)),
      })),
    };
  }

  // taxes
  const taxMatch = {
    ...match,
    status: { $in: ["completed", "served"] },
  };
  const [taxTotal, serviceCharge, docs, total, typeTax] = await Promise.all([
    sumField(OrderModel, taxMatch, "tax"),
    sumField(OrderModel, taxMatch, "serviceCharge"),
    OrderModel.find(taxMatch as Filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.pageSize)
      .select({ orderNumber: 1, tax: 1, serviceCharge: 1, grandTotal: 1, createdAt: 1 })
      .lean()
      .exec(),
    countDocs(OrderModel, taxMatch),
    OrderModel.aggregate<{ _id: string; tax: number }>([
      { $match: taxMatch },
      { $group: { _id: "$orderType", tax: { $sum: "$tax" } } },
    ]).exec(),
  ]);

  return {
    kind: "taxes",
    title: "Tax Summary",
    description: "Tax and service charge collected",
    kpis: [
      {
        id: "tax",
        title: "Tax collected",
        value: formatReportMoney(taxTotal),
        accent: "primary",
      },
      {
        id: "service",
        title: "Service charge",
        value: formatReportMoney(serviceCharge),
        accent: "warning",
      },
      {
        id: "orders",
        title: "Taxed orders",
        value: formatReportNumber(total),
        accent: "success",
      },
    ],
    charts: [
      {
        id: "tax-by-type",
        title: "Tax by order type",
        type: "bar",
        points: typeTax.map((row) => ({
          label: String(row._id),
          value: Number(row.tax ?? 0),
        })),
      },
      {
        id: "mix",
        title: "Tax vs service",
        type: "donut",
        points: [
          { label: "Tax", value: taxTotal },
          { label: "Service", value: serviceCharge },
        ],
      },
    ],
    table: {
      columns: [
        { key: "orderNumber", label: "Order" },
        { key: "tax", label: "Tax", align: "right" },
        { key: "serviceCharge", label: "Service", align: "right" },
        { key: "grandTotal", label: "Total", align: "right" },
        { key: "createdAt", label: "Created" },
      ],
      rows: docs.map((doc) => ({
        orderNumber: doc.orderNumber,
        tax: formatReportMoney(Number(doc.tax ?? 0)),
        serviceCharge: formatReportMoney(Number(doc.serviceCharge ?? 0)),
        grandTotal: formatReportMoney(Number(doc.grandTotal ?? 0)),
        createdAt: doc.createdAt
          ? new Date(doc.createdAt).toLocaleString()
          : "—",
      })),
      meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
      totals: {
        tax: formatReportMoney(taxTotal),
        serviceCharge: formatReportMoney(serviceCharge),
      },
    },
    summary: typeTax.map((row) => ({
      id: String(row._id),
      label: String(row._id),
      value: Number(row.tax ?? 0),
      meta: formatReportMoney(Number(row.tax ?? 0)),
    })),
  };
}

export const reportRepository = {
  getExecutiveDashboard,
  getModuleReport,
};
