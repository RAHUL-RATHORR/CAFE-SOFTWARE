import {
  connectToDatabase,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
  buildPaginationMeta,
  normalizePagination,
  checkDatabaseHealth,
} from "@/lib/database";
import {
  idToString,
  toIso,
} from "@/lib/admin";
import { DEFAULT_PLATFORM_FEATURE_FLAGS } from "@/config/admin";
import {
  AuditLogModel,
  PlatformFeatureFlagModel,
  TenantAdminStateModel,
} from "@/models/admin";
import { RestaurantModel } from "@/models/restaurant";
import { UserModel } from "@/models/user";
import { BranchModel } from "@/models/branch";
import { OrderModel } from "@/models/order";
import {
  InvoiceFoundationModel,
  RestaurantSubscriptionModel,
  SubscriptionPlanModel,
  UsageMetricsModel,
} from "@/models/subscription";
import { subscriptionRepository } from "@/repositories/subscription";
import { addDays } from "@/lib/subscription";
import type {
  AdminAuditLog,
  AdminDashboardSummary,
  AdminGlobalReport,
  AdminRevenueSummary,
  AdminSearchResult,
  AdminSystemHealth,
  AdminTenantDetail,
  AdminTenantSummary,
  AdminUserSummary,
  AuditEventCategory,
  PlatformFeatureFlag,
  TenantPlatformStatus,
} from "@/types/admin";
import type { PaginationMeta } from "@/types/database";

type Filter = Record<string, unknown>;

function serializeAudit(doc: Record<string, unknown>): AdminAuditLog {
  const metadata = (doc.metadata as Record<string, unknown>) ?? {};
  return {
    id: String(doc._id),
    category: (doc.category as AuditEventCategory) ?? "system",
    action: String(doc.action ?? ""),
    message: String(doc.message ?? ""),
    actorId: idToString(doc.actorId),
    actorEmail: String(doc.actorEmail ?? ""),
    restaurantId: idToString(doc.restaurantId),
    restaurantName: String(doc.restaurantName ?? ""),
    targetType: String(doc.targetType ?? "system"),
    targetId: doc.targetId ? String(doc.targetId) : null,
    metadata,
    oldValuePlaceholder: metadata.oldValuePlaceholder ?? null,
    newValuePlaceholder: metadata.newValuePlaceholder ?? null,
    ipPlaceholder:
      typeof metadata.ipPlaceholder === "string"
        ? metadata.ipPlaceholder
        : metadata.ipPlaceholder == null
          ? null
          : String(metadata.ipPlaceholder),
    devicePlaceholder:
      typeof metadata.devicePlaceholder === "string"
        ? metadata.devicePlaceholder
        : metadata.devicePlaceholder == null
          ? null
          : String(metadata.devicePlaceholder),
    createdAt: toIso(doc.createdAt) ?? "",
  };
}

function serializeFlag(doc: Record<string, unknown>): PlatformFeatureFlag {
  return {
    id: String(doc._id),
    key: String(doc.key ?? ""),
    label: String(doc.label ?? ""),
    description: String(doc.description ?? ""),
    enabled: Boolean(doc.enabled),
    scope: (doc.scope as PlatformFeatureFlag["scope"]) ?? "global",
    planSlug: doc.planSlug ? String(doc.planSlug) : null,
    restaurantId: idToString(doc.restaurantId),
    moduleKey: String(doc.moduleKey ?? "general"),
    isBeta: Boolean(doc.isBeta),
    isEarlyAccess: Boolean(doc.isEarlyAccess),
    updatedAt: toIso(doc.updatedAt) ?? "",
  };
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export const adminRepository = {
  async writeAudit(input: {
    category: AuditEventCategory;
    action: string;
    message: string;
    actorId?: string | null;
    actorEmail?: string | null;
    restaurantId?: string | null;
    restaurantName?: string | null;
    targetType?: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
    oldValuePlaceholder?: unknown;
    newValuePlaceholder?: unknown;
    ipPlaceholder?: string | null;
    devicePlaceholder?: string | null;
  }): Promise<AdminAuditLog> {
    await connectToDatabase();
    const metadata = {
      ...(input.metadata ?? {}),
      oldValuePlaceholder:
        input.oldValuePlaceholder ??
        input.metadata?.oldValuePlaceholder ??
        null,
      newValuePlaceholder:
        input.newValuePlaceholder ??
        input.metadata?.newValuePlaceholder ??
        null,
      ipPlaceholder:
        input.ipPlaceholder ?? input.metadata?.ipPlaceholder ?? null,
      devicePlaceholder:
        input.devicePlaceholder ?? input.metadata?.devicePlaceholder ?? null,
    };
    const doc = await AuditLogModel.create({
      category: input.category,
      action: input.action,
      message: input.message,
      actorId:
        input.actorId && isValidObjectId(input.actorId)
          ? toObjectId(input.actorId)
          : null,
      actorEmail: input.actorEmail ?? "",
      restaurantId:
        input.restaurantId && isValidObjectId(input.restaurantId)
          ? toObjectId(input.restaurantId)
          : null,
      restaurantName: input.restaurantName ?? "",
      targetType: input.targetType ?? "system",
      targetId: input.targetId ?? null,
      metadata,
    });
    return serializeAudit(doc.toObject() as never);
  },

  async ensureFeatureFlags(): Promise<void> {
    await connectToDatabase();
    const count = await PlatformFeatureFlagModel.countDocuments(
      notDeletedFilter({}) as Filter
    );
    if (count > 0) return;
    await PlatformFeatureFlagModel.insertMany(
      DEFAULT_PLATFORM_FEATURE_FLAGS.map((flag) => ({
        ...flag,
        planSlug: null,
        restaurantId: null,
      }))
    );
  },

  async getTenantStatusMap(
    restaurantIds: string[]
  ): Promise<Map<string, TenantPlatformStatus>> {
    const map = new Map<string, TenantPlatformStatus>();
    if (restaurantIds.length === 0) return map;
    const docs = await TenantAdminStateModel.find(
      notDeletedFilter({
        restaurantId: {
          $in: restaurantIds
            .filter((id) => isValidObjectId(id))
            .map((id) => toObjectId(id)),
        },
      }) as Filter
    )
      .lean()
      .exec();
    for (const doc of docs) {
      map.set(String(doc.restaurantId), (doc.status as TenantPlatformStatus) ?? "active");
    }
    return map;
  },

  async buildTenantSummary(
    restaurant: Record<string, unknown>,
    extras?: {
      platformStatus?: TenantPlatformStatus;
      branchCount?: number;
      userCount?: number;
      orderCount?: number;
      storageUsage?: number;
      ownerName?: string | null;
      ownerEmail?: string | null;
      saasPlanName?: string | null;
      saasStatus?: string | null;
    }
  ): Promise<AdminTenantSummary> {
    const id = String(restaurant._id);
    const isActive = Boolean(restaurant.isActive);
    return {
      id,
      name: String(restaurant.name ?? ""),
      slug: String(restaurant.slug ?? ""),
      email: String(restaurant.email ?? ""),
      phone: String(restaurant.phone ?? ""),
      city: String(restaurant.city ?? ""),
      country: String(restaurant.country ?? ""),
      isActive,
      platformStatus:
        extras?.platformStatus ?? (isActive ? "active" : "inactive"),
      subscriptionPlan: String(restaurant.subscriptionPlan ?? "free"),
      subscriptionStatus: String(restaurant.subscriptionStatus ?? "trialing"),
      saasPlanName: extras?.saasPlanName ?? null,
      saasStatus: extras?.saasStatus ?? null,
      branchCount: extras?.branchCount ?? 0,
      userCount: extras?.userCount ?? 0,
      orderCount: extras?.orderCount ?? 0,
      storageUsage: extras?.storageUsage ?? 0,
      ownerName: extras?.ownerName ?? null,
      ownerEmail: extras?.ownerEmail ?? null,
      createdAt: toIso(restaurant.createdAt) ?? "",
      updatedAt: toIso(restaurant.updatedAt) ?? "",
    };
  },

  async listTenants(input: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: AdminTenantSummary[]; meta: PaginationMeta }> {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
    });
    const filter = notDeletedFilter({}) as Filter;
    if (input.q?.trim()) {
      const q = input.q.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      RestaurantModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pagination.page - 1) * pagination.pageSize)
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      RestaurantModel.countDocuments(filter),
    ]);

    const ids = docs.map((doc) => String(doc._id));
    const objectIds = ids.filter(isValidObjectId).map((id) => toObjectId(id));
    const statusMap = await this.getTenantStatusMap(ids);

    const [branchAgg, userAgg, orderAgg, usageDocs, owners, subs] =
      await Promise.all([
        BranchModel.aggregate<{ _id: unknown; count: number }>([
          { $match: notDeletedFilter({ restaurantId: { $in: objectIds } }) },
          { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
        ]).exec(),
        UserModel.aggregate<{ _id: unknown; count: number }>([
          { $match: notDeletedFilter({ restaurantId: { $in: objectIds } }) },
          { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
        ]).exec(),
        OrderModel.aggregate<{ _id: unknown; count: number }>([
          { $match: notDeletedFilter({ restaurantId: { $in: objectIds } }) },
          { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
        ]).exec(),
        UsageMetricsModel.find(
          notDeletedFilter({ restaurantId: { $in: objectIds } }) as Filter
        )
          .lean()
          .exec(),
        UserModel.find(
          notDeletedFilter({
            restaurantId: { $in: objectIds },
            role: { $in: ["restaurant-owner", "super-admin"] },
          }) as Filter
        )
          .select({ name: 1, email: 1, restaurantId: 1, role: 1 })
          .lean()
          .exec(),
        RestaurantSubscriptionModel.find(
          notDeletedFilter({ restaurantId: { $in: objectIds } }) as Filter
        )
          .lean()
          .exec(),
      ]);

    const branchMap = new Map(
      branchAgg.map((row) => [String(row._id), row.count])
    );
    const userMap = new Map(userAgg.map((row) => [String(row._id), row.count]));
    const orderMap = new Map(
      orderAgg.map((row) => [String(row._id), row.count])
    );
    const storageMap = new Map(
      usageDocs.map((row) => [String(row.restaurantId), Number(row.storage ?? 0)])
    );
    const ownerMap = new Map<string, { name: string; email: string }>();
    for (const owner of owners) {
      const rid = String(owner.restaurantId ?? "");
      if (!rid || ownerMap.has(rid)) continue;
      if (owner.role === "restaurant-owner" || !ownerMap.has(rid)) {
        ownerMap.set(rid, { name: owner.name, email: owner.email });
      }
    }

    const planIds = [
      ...new Set(
        subs
          .map((sub) => (sub.planId ? String(sub.planId) : null))
          .filter(Boolean) as string[]
      ),
    ];
    const plans =
      planIds.length > 0
        ? await SubscriptionPlanModel.find({
            _id: { $in: planIds.map((id) => toObjectId(id)) },
          } as Filter)
            .select({ name: 1 })
            .lean()
            .exec()
        : [];
    const planNameMap = new Map(plans.map((p) => [String(p._id), p.name]));
    const subMap = new Map(
      subs.map((sub) => [
        String(sub.restaurantId),
        {
          planName: planNameMap.get(String(sub.planId)) ?? null,
          status: String(sub.status ?? ""),
        },
      ])
    );

    let items = await Promise.all(
      docs.map((doc) => {
        const id = String(doc._id);
        return this.buildTenantSummary(doc as never, {
          platformStatus: statusMap.get(id),
          branchCount: branchMap.get(id) ?? 0,
          userCount: userMap.get(id) ?? 0,
          orderCount: orderMap.get(id) ?? 0,
          storageUsage: storageMap.get(id) ?? 0,
          ownerName: ownerMap.get(id)?.name ?? null,
          ownerEmail: ownerMap.get(id)?.email ?? null,
          saasPlanName: subMap.get(id)?.planName ?? null,
          saasStatus: subMap.get(id)?.status ?? null,
        });
      })
    );

    if (input.status && input.status !== "all") {
      items = items.filter((item) => item.platformStatus === input.status);
    }

    return {
      items,
      meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
    };
  },

  async getTenantById(id: string): Promise<AdminTenantDetail | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await RestaurantModel.findOne(
      notDeletedFilter({ _id: toObjectId(id) }) as Filter
    )
      .lean()
      .exec();
    if (!doc) return null;

    const [list] = await Promise.all([
      this.listTenants({ q: doc.slug, page: 1, pageSize: 1 }),
    ]);
    const summary =
      list.items.find((item) => item.id === id) ??
      (await this.buildTenantSummary(doc as never));

    const [sub, usage, featureAccess] = await Promise.all([
      subscriptionRepository.getSubscription(id),
      subscriptionRepository.getUsage(id).catch(() => null),
      subscriptionRepository.getFeatureAccess(id),
    ]);

    return {
      ...summary,
      address: String(doc.address ?? ""),
      state: String(doc.state ?? ""),
      currency: String(doc.currency ?? "USD"),
      timezone: String(doc.timezone ?? ""),
      featureUsage: featureAccess?.features ?? [],
      licenseKey: sub?.licenseKey ?? null,
      renewalDate: sub?.renewalDate ?? null,
      trialEnd: sub?.trialEnd ?? null,
      storageUsage: usage?.storage ?? summary.storageUsage,
    };
  },

  async setTenantStatus(input: {
    restaurantId: string;
    status: TenantPlatformStatus;
    notes?: string;
    actorId?: string | null;
    actorEmail?: string | null;
  }): Promise<AdminTenantDetail | null> {
    await connectToDatabase();
    if (!isValidObjectId(input.restaurantId)) return null;

    const restaurant = await RestaurantModel.findOne(
      notDeletedFilter({ _id: toObjectId(input.restaurantId) }) as Filter
    ).exec();
    if (!restaurant) return null;

    const isActive = input.status === "active";
    restaurant.isActive = isActive;
    await restaurant.save();

    await TenantAdminStateModel.findOneAndUpdate(
      notDeletedFilter({
        restaurantId: toObjectId(input.restaurantId),
      }) as Filter,
      {
        $set: {
          status: input.status,
          notes: input.notes ?? "",
          suspendedAt: input.status === "suspended" ? new Date() : null,
          suspendedBy:
            input.status === "suspended" && input.actorId
              ? toObjectId(input.actorId)
              : null,
          updatedBy: input.actorId ? toObjectId(input.actorId) : null,
        },
        $setOnInsert: {
          restaurantId: toObjectId(input.restaurantId),
          createdBy: input.actorId ? toObjectId(input.actorId) : null,
        },
      },
      { upsert: true, new: true }
    ).exec();

    await this.writeAudit({
      category: "restaurant",
      action: `tenant.${input.status}`,
      message: `Restaurant “${restaurant.name}” set to ${input.status}`,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      restaurantId: input.restaurantId,
      restaurantName: restaurant.name,
      targetType: "restaurant",
      targetId: input.restaurantId,
    });

    return this.getTenantById(input.restaurantId);
  },

  async listUsers(input: {
    q?: string;
    status?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: AdminUserSummary[]; meta: PaginationMeta }> {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
    });
    const filter = notDeletedFilter({}) as Filter;
    if (input.q?.trim()) {
      const q = input.q.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }
    if (input.status && input.status !== "all") filter.status = input.status;
    if (input.role?.trim()) filter.role = input.role.trim();

    const [docs, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pagination.page - 1) * pagination.pageSize)
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      UserModel.countDocuments(filter),
    ]);

    const restaurantIds = [
      ...new Set(
        docs
          .map((doc) => (doc.restaurantId ? String(doc.restaurantId) : null))
          .filter(Boolean) as string[]
      ),
    ];
    const restaurants =
      restaurantIds.length > 0
        ? await RestaurantModel.find({
            _id: { $in: restaurantIds.map((id) => toObjectId(id)) },
          } as Filter)
            .select({ name: 1 })
            .lean()
            .exec()
        : [];
    const nameMap = new Map(
      restaurants.map((row) => [String(row._id), row.name])
    );

    const items: AdminUserSummary[] = docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      phone: doc.phone ?? "",
      role: doc.role,
      status: doc.status,
      restaurantId: idToString(doc.restaurantId),
      restaurantName: doc.restaurantId
        ? nameMap.get(String(doc.restaurantId)) ?? null
        : null,
      lastLogin: toIso(doc.lastLogin),
      createdAt: toIso(doc.createdAt) ?? "",
      updatedAt: toIso(doc.updatedAt) ?? "",
    }));

    return {
      items,
      meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
    };
  },

  async updateUser(input: {
    id: string;
    name?: string;
    phone?: string;
    role?: string;
    status?: string;
    restaurantId?: string | null;
    actorId?: string | null;
    actorEmail?: string | null;
  }): Promise<AdminUserSummary | null> {
    await connectToDatabase();
    if (!isValidObjectId(input.id)) return null;
    const $set: Filter = {
      updatedBy: input.actorId ? toObjectId(input.actorId) : null,
    };
    if (input.name !== undefined) $set.name = input.name;
    if (input.phone !== undefined) $set.phone = input.phone;
    if (input.role !== undefined) $set.role = input.role;
    if (input.status !== undefined) $set.status = input.status;
    if (input.restaurantId !== undefined) {
      $set.restaurantId =
        input.restaurantId && isValidObjectId(input.restaurantId)
          ? toObjectId(input.restaurantId)
          : null;
    }

    const doc = await UserModel.findOneAndUpdate(
      notDeletedFilter({ _id: toObjectId(input.id) }) as Filter,
      { $set },
      { new: true }
    )
      .lean()
      .exec();
    if (!doc) return null;

    await this.writeAudit({
      category: input.role !== undefined ? "role" : "user",
      action: "user.update",
      message: `Updated user ${doc.email}`,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      restaurantId: idToString(doc.restaurantId),
      targetType: "user",
      targetId: String(doc._id),
      metadata: { status: doc.status, role: doc.role },
    });

    const list = await this.listUsers({ q: doc.email, page: 1, pageSize: 1 });
    return list.items[0] ?? null;
  },

  async getDashboard(): Promise<AdminDashboardSummary> {
    await connectToDatabase();
    const now = new Date();
    const dayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

    const [
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      expiredSubscriptions,
      monthlyPaid,
      annualPaid,
      ordersToday,
      recentAudits,
      latestRestaurants,
      paidInvoices,
      plans,
      health,
    ] = await Promise.all([
      RestaurantModel.countDocuments(notDeletedFilter({}) as Filter),
      RestaurantModel.countDocuments(
        notDeletedFilter({ isActive: true }) as Filter
      ),
      RestaurantSubscriptionModel.countDocuments(
        notDeletedFilter({ status: "trial" }) as Filter
      ),
      RestaurantSubscriptionModel.countDocuments(
        notDeletedFilter({ status: { $in: ["expired", "cancelled"] } }) as Filter
      ),
      InvoiceFoundationModel.aggregate<{ total: number }>([
        {
          $match: notDeletedFilter({
            status: "paid",
            paidAt: { $gte: monthStart },
          }),
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).exec(),
      InvoiceFoundationModel.aggregate<{ total: number }>([
        {
          $match: notDeletedFilter({
            status: "paid",
            paidAt: { $gte: yearStart },
          }),
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).exec(),
      OrderModel.countDocuments(
        notDeletedFilter({ createdAt: { $gte: dayStart } }) as Filter
      ),
      AuditLogModel.find(notDeletedFilter({}) as Filter)
        .sort({ createdAt: -1 })
        .limit(8)
        .lean()
        .exec(),
      RestaurantModel.find(notDeletedFilter({}) as Filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec(),
      InvoiceFoundationModel.find(
        notDeletedFilter({ status: "paid" }) as Filter
      )
        .sort({ paidAt: -1 })
        .limit(120)
        .lean()
        .exec(),
      SubscriptionPlanModel.find(notDeletedFilter({ isActive: true }) as Filter)
        .lean()
        .exec(),
      checkDatabaseHealth(),
    ]);

    const revenueByMonthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      revenueByMonthMap.set(monthLabel(d), 0);
    }
    for (const invoice of paidInvoices) {
      const paidAt = invoice.paidAt ? new Date(invoice.paidAt) : null;
      if (!paidAt || Number.isNaN(paidAt.getTime())) continue;
      const label = monthLabel(paidAt);
      if (revenueByMonthMap.has(label)) {
        revenueByMonthMap.set(
          label,
          (revenueByMonthMap.get(label) ?? 0) + Number(invoice.amount ?? 0)
        );
      }
    }

    const subDist = await RestaurantSubscriptionModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: notDeletedFilter({}) },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec();

    const statusMap = await this.getTenantStatusMap(
      latestRestaurants.map((r) => String(r._id))
    );
    const latestSignups = await Promise.all(
      latestRestaurants.map((doc) =>
        this.buildTenantSummary(doc as never, {
          platformStatus: statusMap.get(String(doc._id)),
        })
      )
    );

    void plans;

    return {
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      expiredSubscriptions,
      monthlyRevenue: Number(monthlyPaid[0]?.total ?? 0),
      annualRevenue: Number(annualPaid[0]?.total ?? 0),
      ordersToday,
      usersOnlinePlaceholder: 0,
      apiUsagePlaceholder: 0,
      systemStatus: health.ok ? "healthy" : "degraded",
      recentActivities: recentAudits.map((doc) =>
        serializeAudit(doc as never)
      ),
      latestSignups,
      revenueChart: [...revenueByMonthMap.entries()].map(([label, value]) => ({
        label,
        value,
      })),
      subscriptionDistribution: subDist.map((row) => ({
        label: String(row._id),
        value: row.count,
      })),
    };
  },

  async getRevenueSummary(): Promise<AdminRevenueSummary> {
    const dashboard = await this.getDashboard();
    const [paidCount, openCount, byPlan] = await Promise.all([
      InvoiceFoundationModel.countDocuments(
        notDeletedFilter({ status: "paid" }) as Filter
      ),
      InvoiceFoundationModel.countDocuments(
        notDeletedFilter({ status: "open" }) as Filter
      ),
      InvoiceFoundationModel.aggregate<{ _id: unknown; total: number }>([
        { $match: notDeletedFilter({ status: "paid" }) },
        { $group: { _id: "$planId", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]).exec(),
    ]);

    const planIds = byPlan
      .map((row) => (row._id ? String(row._id) : null))
      .filter(Boolean) as string[];
    const planFilter: Filter = {
      _id: { $in: planIds.map((id) => toObjectId(id)) },
    };
    const plans =
      planIds.length > 0
        ? await SubscriptionPlanModel.find(planFilter)
            .select({ name: 1 })
            .lean()
            .exec()
        : [];
    const planMap = new Map(plans.map((p) => [String(p._id), p.name]));

    return {
      monthlyRevenue: dashboard.monthlyRevenue,
      annualRevenue: dashboard.annualRevenue,
      paidInvoices: paidCount,
      openInvoices: openCount,
      revenueByMonth: dashboard.revenueChart,
      revenueByPlan: byPlan.map((row) => ({
        label: row._id ? planMap.get(String(row._id)) ?? "Unknown" : "Unknown",
        value: Number(row.total ?? 0),
      })),
    };
  },

  async getSystemHealth(): Promise<AdminSystemHealth> {
    const health = await checkDatabaseHealth();
    return {
      databaseStatus: health.ok ? "ok" : "error",
      applicationStatus: "ok",
      storageStatusPlaceholder: "unknown",
      errorRatePlaceholder: 0,
      serverUptimePlaceholder: "—",
      latestDeploymentsPlaceholder: [
        {
          id: "local-1",
          label: "Local development build",
          at: new Date().toISOString(),
        },
      ],
      checkedAt: new Date().toISOString(),
    };
  },

  async listAudit(input: {
    q?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: AdminAuditLog[]; meta: PaginationMeta }> {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
    });
    const filter = notDeletedFilter({}) as Filter;
    if (input.category && input.category !== "all") {
      filter.category = input.category;
    }
    if (input.q?.trim()) {
      const q = input.q.trim();
      filter.$or = [
        { message: { $regex: q, $options: "i" } },
        { action: { $regex: q, $options: "i" } },
        { actorEmail: { $regex: q, $options: "i" } },
        { restaurantName: { $regex: q, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pagination.page - 1) * pagination.pageSize)
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      AuditLogModel.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) => serializeAudit(doc as never)),
      meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
    };
  },

  async listFeatureFlags(): Promise<PlatformFeatureFlag[]> {
    await this.ensureFeatureFlags();
    const docs = await PlatformFeatureFlagModel.find(
      notDeletedFilter({}) as Filter
    )
      .sort({ scope: 1, key: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializeFlag(doc as never));
  },

  async toggleFeatureFlag(input: {
    id: string;
    enabled: boolean;
    actorId?: string | null;
    actorEmail?: string | null;
  }): Promise<PlatformFeatureFlag | null> {
    await connectToDatabase();
    if (!isValidObjectId(input.id)) return null;
    const doc = await PlatformFeatureFlagModel.findOneAndUpdate(
      notDeletedFilter({ _id: toObjectId(input.id) }) as Filter,
      {
        $set: {
          enabled: input.enabled,
          updatedBy: input.actorId ? toObjectId(input.actorId) : null,
        },
      },
      { new: true }
    )
      .lean()
      .exec();
    if (!doc) return null;
    await this.writeAudit({
      category: "feature-flag",
      action: input.enabled ? "flag.enable" : "flag.disable",
      message: `${input.enabled ? "Enabled" : "Disabled"} flag ${doc.key}`,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      targetType: "feature-flag",
      targetId: String(doc._id),
    });
    return serializeFlag(doc as never);
  },

  async extendTrial(input: {
    restaurantId: string;
    days: number;
    actorId?: string | null;
    actorEmail?: string | null;
  }) {
    await connectToDatabase();
    const sub = await RestaurantSubscriptionModel.findOne(
      notDeletedFilter({
        restaurantId: toObjectId(input.restaurantId),
      }) as Filter
    ).exec();
    if (!sub) return null;

    const base =
      sub.trialEnd && sub.trialEnd > new Date() ? sub.trialEnd : new Date();
    sub.trialEnd = addDays(base, input.days);
    sub.status = "trial";
    sub.renewalDate = sub.trialEnd;
    if (input.actorId) sub.updatedBy = toObjectId(input.actorId) as never;
    await sub.save();

    const restaurant = await RestaurantModel.findById(input.restaurantId)
      .select({ name: 1 })
      .lean()
      .exec();

    await this.writeAudit({
      category: "subscription",
      action: "trial.extend",
      message: `Extended trial by ${input.days} day(s)`,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      restaurantId: input.restaurantId,
      restaurantName: restaurant?.name ?? "",
      targetType: "subscription",
      targetId: String(sub._id),
    });

    return subscriptionRepository.getSubscription(input.restaurantId);
  },

  async globalSearch(q: string): Promise<AdminSearchResult[]> {
    await connectToDatabase();
    const query = q.trim();
    if (!query) return [];
    const regex = { $regex: query, $options: "i" };

    const [restaurants, users, plans, audits] = await Promise.all([
      RestaurantModel.find(notDeletedFilter({ $or: [{ name: regex }, { slug: regex }, { email: regex }] }) as Filter)
        .limit(5)
        .lean()
        .exec(),
      UserModel.find(
        notDeletedFilter({ $or: [{ name: regex }, { email: regex }] }) as Filter
      )
        .limit(5)
        .lean()
        .exec(),
      SubscriptionPlanModel.find(
        notDeletedFilter({ $or: [{ name: regex }, { slug: regex }] }) as Filter
      )
        .limit(5)
        .lean()
        .exec(),
      AuditLogModel.find(
        notDeletedFilter({
          $or: [{ message: regex }, { action: regex }],
        }) as Filter
      )
        .limit(5)
        .lean()
        .exec(),
    ]);

    const results: AdminSearchResult[] = [
      ...restaurants.map((doc) => ({
        id: String(doc._id),
        type: "restaurant" as const,
        title: doc.name,
        subtitle: doc.email,
        href: `/admin/restaurants?q=${encodeURIComponent(doc.slug)}`,
      })),
      ...users.map((doc) => ({
        id: String(doc._id),
        type: "user" as const,
        title: doc.name,
        subtitle: doc.email,
        href: `/admin/users?q=${encodeURIComponent(doc.email)}`,
      })),
      ...plans.map((doc) => ({
        id: String(doc._id),
        type: "plan" as const,
        title: doc.name,
        subtitle: doc.slug,
        href: `/admin/plans`,
      })),
      ...audits.map((doc) => ({
        id: String(doc._id),
        type: "audit" as const,
        title: String(doc.action),
        subtitle: String(doc.message),
        href: `/admin/audit?q=${encodeURIComponent(String(doc.action))}`,
      })),
    ];

    if ("settings".includes(query.toLowerCase()) || query.toLowerCase().includes("setting")) {
      results.push({
        id: "settings",
        type: "setting",
        title: "Admin settings",
        subtitle: "Platform settings & feature flags",
        href: "/admin/settings",
      });
    }

    return results.slice(0, 20);
  },

  async getGlobalReport(
    kind: AdminGlobalReport["kind"]
  ): Promise<AdminGlobalReport> {
    const dashboard = await this.getDashboard();
    const revenue = await this.getRevenueSummary();

    const base = {
      kind,
      title: "",
      description: "",
      kpis: [] as AdminGlobalReport["kpis"],
      series: [] as AdminGlobalReport["series"],
    };

    switch (kind) {
      case "revenue":
        return {
          ...base,
          title: "Revenue Report",
          description: "Paid SaaS invoice foundations",
          kpis: [
            {
              id: "mrr",
              title: "Monthly revenue",
              value: String(revenue.monthlyRevenue),
            },
            {
              id: "arr",
              title: "Annual revenue",
              value: String(revenue.annualRevenue),
            },
          ],
          series: revenue.revenueByMonth,
        };
      case "tenant-growth":
      case "restaurant-growth":
        return {
          ...base,
          title: "Restaurant Growth",
          description: "Tenant signups overview",
          kpis: [
            {
              id: "total",
              title: "Total restaurants",
              value: String(dashboard.totalRestaurants),
            },
            {
              id: "active",
              title: "Active",
              value: String(dashboard.activeRestaurants),
            },
          ],
          series: dashboard.latestSignups.map((item) => ({
            label: item.name.slice(0, 12),
            value: 1,
          })),
        };
      case "subscription-growth":
        return {
          ...base,
          title: "Subscription Growth",
          description: "Distribution by SaaS status",
          kpis: [
            {
              id: "trial",
              title: "Trials",
              value: String(dashboard.trialRestaurants),
            },
            {
              id: "expired",
              title: "Expired/Cancelled",
              value: String(dashboard.expiredSubscriptions),
            },
          ],
          series: dashboard.subscriptionDistribution,
        };
      case "user-growth": {
        const totalUsers = await UserModel.countDocuments(
          notDeletedFilter({}) as Filter
        );
        return {
          ...base,
          title: "User Growth",
          description: "Platform users",
          kpis: [{ id: "users", title: "Total users", value: String(totalUsers) }],
          series: [{ label: "Users", value: totalUsers }],
        };
      }
      case "storage-usage": {
        const usage = await UsageMetricsModel.aggregate<{ total: number }>([
          { $match: notDeletedFilter({}) },
          { $group: { _id: null, total: { $sum: "$storage" } } },
        ]).exec();
        return {
          ...base,
          title: "Storage Usage",
          description: "Aggregate tenant storage (MB)",
          kpis: [
            {
              id: "storage",
              title: "Total MB",
              value: String(usage[0]?.total ?? 0),
            },
          ],
          series: [{ label: "Storage", value: Number(usage[0]?.total ?? 0) }],
        };
      }
      case "api-usage":
        return {
          ...base,
          title: "API Usage",
          description: "Placeholder — no external API metering yet",
          kpis: [{ id: "api", title: "Requests", value: "0" }],
          series: [{ label: "API", value: 0 }],
        };
      case "platform-usage":
      default:
        return {
          ...base,
          title: "Platform Usage",
          description: "Orders and tenant activity",
          kpis: [
            {
              id: "orders",
              title: "Orders today",
              value: String(dashboard.ordersToday),
            },
            {
              id: "tenants",
              title: "Restaurants",
              value: String(dashboard.totalRestaurants),
            },
          ],
          series: dashboard.revenueChart,
        };
    }
  },
};
