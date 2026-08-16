import {
  connectToDatabase,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import {
  serializePlan,
  serializeSubscription,
  serializeUsage,
  serializeInvoice,
  serializeFeatureAccess,
  slugifyPlanName,
  generateLicenseKey,
  currentPeriodKey,
  addDays,
  addMonths,
  toLegacyPlanSlug,
  toLegacySubscriptionStatus,
  planToLimits,
  daysRemaining,
  evaluateDowngradeImpact,
  getPaymentProvider,
  buildAccessSnapshot,
  evaluateTenantLimits,
  getSubscriptionPeriodEnd,
} from "@/lib/subscription";
import { DEFAULT_PLAN_SEEDS } from "@/config/subscription";
import {
  SubscriptionPlanModel,
  RestaurantSubscriptionModel,
  UsageMetricsModel,
  InvoiceFoundationModel,
  FeatureAccessModel,
} from "@/models/subscription";
import { RestaurantModel } from "@/models/restaurant";
import { UserModel } from "@/models/user";
import { BranchModel } from "@/models/branch";
import { OrderModel } from "@/models/order";
import { MenuItemModel } from "@/models/menu-item";
import { CustomerModel } from "@/models/customer";
import { IngredientModel } from "@/models/inventory";
import { RestaurantTableModel } from "@/models/restaurant-table";
import type {
  SubscriptionPlanEntity,
  RestaurantSubscription,
  UsageMetrics,
  InvoiceFoundation,
  FeatureAccess,
  SubscriptionDashboardSummary,
  SaasFeatureKey,
  BillingCycle,
  SaasSubscriptionStatus,
} from "@/types/subscription";
import type { CreatePlanInput, UpdatePlanInput } from "@/lib/validators/subscription";

type Filter = Record<string, unknown>;

function optionalRef(value: string | null | undefined) {
  if (!value || !isValidObjectId(value)) return null;
  return toObjectId(value);
}

function invoiceNumber(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${y}${m}${d}-${suffix}`;
}

async function resolvePlanMeta(planId: unknown) {
  if (!planId || !isValidObjectId(String(planId))) return null;
  const plan = await SubscriptionPlanModel.findById(planId)
    .select({ name: 1, slug: 1 })
    .lean()
    .exec();
  if (!plan) return null;
  return { name: plan.name, slug: plan.slug };
}

async function syncRestaurantScaffold(
  restaurantId: string,
  planSlug: string,
  status: SaasSubscriptionStatus
) {
  if (!isValidObjectId(restaurantId)) return;
  await RestaurantModel.updateOne(
    { _id: toObjectId(restaurantId), isDeleted: { $ne: true } } as Filter,
    {
      $set: {
        subscriptionPlan: toLegacyPlanSlug(planSlug),
        subscriptionStatus: toLegacySubscriptionStatus(status),
      },
    }
  ).exec();
}

async function upsertFeatureAccess(
  restaurantId: string,
  features: SaasFeatureKey[],
  userId?: string | null
) {
  const filter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  }) as Filter;
  const doc = await FeatureAccessModel.findOneAndUpdate(
    filter,
    {
      $set: {
        features,
        updatedBy: optionalRef(userId),
      },
      $setOnInsert: {
        restaurantId: toObjectId(restaurantId),
        overrides: {},
        createdBy: optionalRef(userId),
      },
    },
    { upsert: true, new: true }
  ).exec();
  return serializeFeatureAccess(doc);
}

export const subscriptionRepository = {
  async ensureDefaultPlans(userId?: string | null): Promise<void> {
    await connectToDatabase();
    const count = await SubscriptionPlanModel.countDocuments(
      notDeletedFilter({})
    );
    if (count > 0) {
      // Best-effort backfill for renamed catalog slugs without deleting custom plans.
      for (const seed of DEFAULT_PLAN_SEEDS) {
        await SubscriptionPlanModel.updateOne(
          notDeletedFilter({
            $or: [{ slug: seed.slug }, { planKey: seed.planKey }],
          }) as Filter,
          {
            $set: {
              planKey: seed.planKey,
              displayName: seed.displayName,
              maxStaff: seed.maxStaff,
              maxCustomers: seed.maxCustomers,
            },
          }
        ).exec();
      }
      return;
    }

    await SubscriptionPlanModel.insertMany(
      DEFAULT_PLAN_SEEDS.map((seed) => ({
        planKey: seed.planKey,
        name: seed.name,
        displayName: seed.displayName,
        slug: seed.slug,
        description: seed.description,
        monthlyPrice: seed.monthlyPrice,
        yearlyPrice: seed.yearlyPrice,
        currency: seed.currency,
        trialDays: seed.trialDays,
        maxBranches: seed.maxBranches,
        maxStaff: seed.maxStaff,
        maxUsers: seed.maxUsers,
        maxOrdersPerMonth: seed.maxOrdersPerMonth,
        maxMenuItems: seed.maxMenuItems,
        maxTables: seed.maxTables,
        maxCustomers: seed.maxCustomers,
        storageLimit: seed.storageLimit,
        features: [...seed.features],
        isPopular: seed.isPopular,
        isActive: seed.isActive,
        sortOrder: seed.sortOrder,
        createdBy: optionalRef(userId),
      }))
    );
  },

  async findPlans(input: {
    q?: string;
    activeOnly?: boolean;
  }): Promise<SubscriptionPlanEntity[]> {
    await connectToDatabase();
    await this.ensureDefaultPlans();

    const filter = notDeletedFilter({}) as Record<string, unknown>;
    if (input.activeOnly !== false) filter.isActive = true;
    if (input.q?.trim()) {
      const q = input.q.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const docs = await SubscriptionPlanModel.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();
    return docs.map((doc) => serializePlan(doc as never));
  },

  async findPlanById(id: string): Promise<SubscriptionPlanEntity | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await SubscriptionPlanModel.findOne(
      notDeletedFilter({ _id: toObjectId(id) }) as Filter
    )
      .lean()
      .exec();
    return doc ? serializePlan(doc as never) : null;
  },

  async findPlanBySlug(slug: string): Promise<SubscriptionPlanEntity | null> {
    await connectToDatabase();
    const doc = await SubscriptionPlanModel.findOne(
      notDeletedFilter({ slug: slug.toLowerCase() }) as Filter
    )
      .lean()
      .exec();
    return doc ? serializePlan(doc as never) : null;
  },

  async createPlan(
    data: CreatePlanInput & { createdBy?: string | null }
  ): Promise<SubscriptionPlanEntity> {
    await connectToDatabase();
    const slug = data.slug?.trim()
      ? data.slug.trim().toLowerCase()
      : slugifyPlanName(data.name);

    const existing = await SubscriptionPlanModel.findOne(
      notDeletedFilter({ slug }) as Filter
    )
      .lean()
      .exec();
    if (existing) {
      throw Object.assign(new Error("DUPLICATE_PLAN"), { code: "DUPLICATE_PLAN" });
    }

    const doc = await SubscriptionPlanModel.create({
      planKey: data.planKey ?? null,
      name: data.name,
      displayName: data.displayName?.trim() || data.name,
      slug,
      description: data.description ?? "",
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      currency: data.currency,
      trialDays: data.trialDays,
      maxBranches: data.maxBranches,
      maxStaff: data.maxStaff ?? data.maxUsers,
      maxUsers: data.maxUsers ?? data.maxStaff,
      maxOrdersPerMonth: data.maxOrdersPerMonth,
      maxMenuItems: data.maxMenuItems,
      maxTables: data.maxTables,
      maxCustomers: data.maxCustomers ?? 0,
      storageLimit: data.storageLimit,
      features: data.features ?? [],
      isPopular: data.isPopular,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      createdBy: optionalRef(data.createdBy),
    });
    return serializePlan(doc);
  },

  async updatePlan(
    id: string,
    data: Omit<UpdatePlanInput, "id"> & { updatedBy?: string | null }
  ): Promise<SubscriptionPlanEntity | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    const $set: Record<string, unknown> = {
      updatedBy: optionalRef(data.updatedBy),
    };
    if (data.name !== undefined) $set.name = data.name;
    if (data.displayName !== undefined) $set.displayName = data.displayName;
    if (data.planKey !== undefined) $set.planKey = data.planKey;
    if (data.slug !== undefined && data.slug !== "")
      $set.slug = data.slug.toLowerCase();
    if (data.description !== undefined) $set.description = data.description;
    if (data.monthlyPrice !== undefined) $set.monthlyPrice = data.monthlyPrice;
    if (data.yearlyPrice !== undefined) $set.yearlyPrice = data.yearlyPrice;
    if (data.currency !== undefined) $set.currency = data.currency;
    if (data.trialDays !== undefined) $set.trialDays = data.trialDays;
    if (data.maxBranches !== undefined) $set.maxBranches = data.maxBranches;
    if (data.maxStaff !== undefined) $set.maxStaff = data.maxStaff;
    if (data.maxUsers !== undefined) $set.maxUsers = data.maxUsers;
    if (data.maxStaff !== undefined && data.maxUsers === undefined) {
      $set.maxUsers = data.maxStaff;
    }
    if (data.maxUsers !== undefined && data.maxStaff === undefined) {
      $set.maxStaff = data.maxUsers;
    }
    if (data.maxOrdersPerMonth !== undefined)
      $set.maxOrdersPerMonth = data.maxOrdersPerMonth;
    if (data.maxMenuItems !== undefined) $set.maxMenuItems = data.maxMenuItems;
    if (data.maxTables !== undefined) $set.maxTables = data.maxTables;
    if (data.maxCustomers !== undefined) $set.maxCustomers = data.maxCustomers;
    if (data.storageLimit !== undefined) $set.storageLimit = data.storageLimit;
    if (data.features !== undefined) $set.features = data.features;
    if (data.isPopular !== undefined) $set.isPopular = data.isPopular;
    if (data.isActive !== undefined) $set.isActive = data.isActive;
    if (data.sortOrder !== undefined) $set.sortOrder = data.sortOrder;

    if (typeof $set.slug === "string") {
      const clash = await SubscriptionPlanModel.findOne(
        notDeletedFilter({
          slug: $set.slug,
          _id: { $ne: toObjectId(id) },
        }) as Filter
      )
        .lean()
        .exec();
      if (clash) {
        throw Object.assign(new Error("DUPLICATE_PLAN"), {
          code: "DUPLICATE_PLAN",
        });
      }
    }

    const doc = await SubscriptionPlanModel.findOneAndUpdate(
      notDeletedFilter({ _id: toObjectId(id) }) as Filter,
      { $set },
      { new: true }
    )
      .lean()
      .exec();
    return doc ? serializePlan(doc as never) : null;
  },

  async softDeletePlan(
    id: string,
    userId?: string | null
  ): Promise<SubscriptionPlanEntity | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await SubscriptionPlanModel.findOneAndUpdate(
      notDeletedFilter({ _id: toObjectId(id) }) as Filter,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          updatedBy: optionalRef(userId),
        },
      },
      { new: true }
    )
      .lean()
      .exec();
    return doc ? serializePlan(doc as never) : null;
  },

  async getSubscription(
    restaurantId: string
  ): Promise<RestaurantSubscription | null> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) return null;
    const doc = await RestaurantSubscriptionModel.findOne(
      notDeletedFilter({ restaurantId: toObjectId(restaurantId) }) as Filter
    )
      .lean()
      .exec();
    if (!doc) return null;
    const plan = await resolvePlanMeta(doc.planId);
    return serializeSubscription(doc as never, plan);
  },

  async assignPlan(input: {
    restaurantId: string;
    planId: string;
    billingCycle: BillingCycle;
    startTrial: boolean;
    userId?: string | null;
  }): Promise<RestaurantSubscription> {
    await connectToDatabase();
    const plan = await this.findPlanById(input.planId);
    if (!plan || !plan.isActive) {
      throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
    }

    const now = new Date();
    const trialDays = input.startTrial ? plan.trialDays : 0;
    const trialStart = trialDays > 0 ? now : null;
    const trialEnd = trialDays > 0 ? addDays(now, trialDays) : null;
    const status: SaasSubscriptionStatus =
      trialDays > 0 ? "trialing" : "active";
    const subscriptionStart = trialDays > 0 ? null : now;
    const subscriptionEnd =
      trialDays > 0
        ? null
        : input.billingCycle === "yearly"
          ? addMonths(now, 12)
          : addMonths(now, 1);
    const currentPeriodStart = trialStart ?? subscriptionStart;
    const currentPeriodEnd = trialEnd ?? subscriptionEnd;
    const renewalDate = currentPeriodEnd;

    const existing = await RestaurantSubscriptionModel.findOne(
      notDeletedFilter({ restaurantId: toObjectId(input.restaurantId) }) as Filter
    ).exec();

    const licenseKey =
      existing?.licenseKey || generateLicenseKey(input.restaurantId);

    let doc;
    if (existing) {
      existing.planId = toObjectId(input.planId) as never;
      existing.status = status;
      existing.billingCycle = input.billingCycle;
      existing.trialStart = trialStart;
      existing.trialEnd = trialEnd;
      existing.subscriptionStart = subscriptionStart;
      existing.subscriptionEnd = subscriptionEnd;
      (existing as { currentPeriodStart?: Date | null }).currentPeriodStart =
        currentPeriodStart;
      (existing as { currentPeriodEnd?: Date | null }).currentPeriodEnd =
        currentPeriodEnd;
      (existing as { gracePeriodEnd?: Date | null }).gracePeriodEnd = null;
      (existing as { cancelAtPeriodEnd?: boolean }).cancelAtPeriodEnd = false;
      (existing as { pendingPlanChange?: unknown }).pendingPlanChange = null;
      (existing as { paymentStatus?: string }).paymentStatus = "not_configured";
      existing.renewalDate = renewalDate;
      existing.cancelledAt = null;
      existing.licenseKey = licenseKey;
      existing.updatedBy = optionalRef(input.userId) as never;
      doc = await existing.save();
    } else {
      doc = await RestaurantSubscriptionModel.create({
        restaurantId: toObjectId(input.restaurantId),
        planId: toObjectId(input.planId),
        status,
        billingCycle: input.billingCycle,
        trialStart,
        trialEnd,
        subscriptionStart,
        subscriptionEnd,
        currentPeriodStart,
        currentPeriodEnd,
        gracePeriodEnd: null,
        renewalDate,
        cancelledAt: null,
        cancelAtPeriodEnd: false,
        pendingPlanChange: null,
        paymentStatus: "not_configured",
        licenseKey,
        createdBy: optionalRef(input.userId),
      });
    }

    await upsertFeatureAccess(input.restaurantId, plan.features, input.userId);
    await syncRestaurantScaffold(input.restaurantId, plan.slug, status);
    await this.createInvoiceDraft({
      restaurantId: input.restaurantId,
      subscriptionId: String(doc._id),
      planId: plan.id,
      amount:
        input.billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice,
      currency: plan.currency,
      billingCycle: input.billingCycle,
      periodStart: now,
      periodEnd: renewalDate,
      userId: input.userId,
    });

    return serializeSubscription(doc, { name: plan.name, slug: plan.slug });
  },

  async changePlan(input: {
    restaurantId: string;
    planId: string;
    billingCycle?: BillingCycle;
    mode: "upgrade" | "downgrade";
    userId?: string | null;
    acknowledgeDowngradeLimits?: boolean;
    scheduleAtPeriodEnd?: boolean;
  }): Promise<RestaurantSubscription> {
    const current = await this.getSubscription(input.restaurantId);
    if (!current) {
      throw Object.assign(new Error("NO_SUBSCRIPTION"), {
        code: "NO_SUBSCRIPTION",
      });
    }

    const nextPlan = await this.findPlanById(input.planId);
    if (!nextPlan || !nextPlan.isActive) {
      throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
    }

    const usage = await this.getUsage(input.restaurantId);
    const impact = evaluateDowngradeImpact({
      currentUsage: usage,
      targetPlan: nextPlan,
    });
    const exceeds = impact.filter((item) => item.exceeds);

    if (input.mode === "downgrade" && exceeds.length > 0) {
      if (!input.acknowledgeDowngradeLimits) {
        throw Object.assign(new Error("DOWNGRADE_EXCEEDS_LIMITS"), {
          code: "DOWNGRADE_EXCEEDS_LIMITS",
          details: {
            message:
              "Your current usage exceeds the limits of this plan.",
            affected: exceeds,
          },
        });
      }

      const scheduleAt =
        input.scheduleAtPeriodEnd !== false
          ? current.currentPeriodEnd ??
            current.subscriptionEnd ??
            current.renewalDate
          : null;

      const doc = await RestaurantSubscriptionModel.findOneAndUpdate(
        notDeletedFilter({
          restaurantId: toObjectId(input.restaurantId),
        }) as Filter,
        {
          $set: {
            pendingPlanChange: {
              planId: toObjectId(input.planId),
              mode: "downgrade",
              billingCycle: input.billingCycle ?? current.billingCycle,
              scheduledFor: scheduleAt ? new Date(scheduleAt) : null,
              reason: "Scheduled because current usage exceeds target limits.",
            },
            updatedBy: optionalRef(input.userId),
          },
        },
        { new: true }
      ).exec();

      if (!doc) {
        throw Object.assign(new Error("NO_SUBSCRIPTION"), {
          code: "NO_SUBSCRIPTION",
        });
      }

      const plan = await resolvePlanMeta(doc.planId);
      return serializeSubscription(doc, plan);
    }

    // Upgrades / safe downgrades: local plan assignment only.
    // Payment provider remains not configured — no fake payment success.
    const provider = getPaymentProvider();
    await provider.changeSubscription({
      providerSubscriptionId: current.providerSubscriptionId ?? "local",
      planId: input.planId,
      billingCycle: input.billingCycle ?? current.billingCycle,
    });

    const cycle = input.billingCycle ?? current.billingCycle;
    const now = new Date();
    const end =
      cycle === "yearly" ? addMonths(now, 12) : addMonths(now, 1);

    const doc = await RestaurantSubscriptionModel.findOneAndUpdate(
      notDeletedFilter({
        restaurantId: toObjectId(input.restaurantId),
      }) as Filter,
      {
        $set: {
          planId: toObjectId(input.planId),
          billingCycle: cycle,
          status: "active" as SaasSubscriptionStatus,
          subscriptionStart: now,
          subscriptionEnd: end,
          currentPeriodStart: now,
          currentPeriodEnd: end,
          renewalDate: end,
          cancelledAt: null,
          cancelAtPeriodEnd: false,
          pendingPlanChange: null,
          gracePeriodEnd: null,
          paymentStatus: "not_configured",
          updatedBy: optionalRef(input.userId),
        },
      },
      { new: true }
    ).exec();

    if (!doc) {
      throw Object.assign(new Error("NO_SUBSCRIPTION"), {
        code: "NO_SUBSCRIPTION",
      });
    }

    await upsertFeatureAccess(
      input.restaurantId,
      nextPlan.features,
      input.userId
    );
    await syncRestaurantScaffold(input.restaurantId, nextPlan.slug, "active");
    await this.createInvoiceDraft({
      restaurantId: input.restaurantId,
      subscriptionId: String(doc._id),
      planId: nextPlan.id,
      amount: cycle === "yearly" ? nextPlan.yearlyPrice : nextPlan.monthlyPrice,
      currency: nextPlan.currency,
      billingCycle: cycle,
      periodStart: now,
      periodEnd: end,
      userId: input.userId,
    });

    return serializeSubscription(doc, {
      name: nextPlan.name,
      slug: nextPlan.slug,
    });
  },

  async cancelSubscription(input: {
    restaurantId: string;
    userId?: string | null;
    cancelAtPeriodEnd?: boolean;
    reason?: string;
  }): Promise<RestaurantSubscription> {
    await connectToDatabase();
    const current = await this.getSubscription(input.restaurantId);
    if (!current) {
      throw Object.assign(new Error("NO_SUBSCRIPTION"), {
        code: "NO_SUBSCRIPTION",
      });
    }

    const cancelAtPeriodEnd = input.cancelAtPeriodEnd !== false;
    const now = new Date();
    const periodEnd =
      current.currentPeriodEnd ??
      current.subscriptionEnd ??
      current.renewalDate ??
      current.trialEnd;

    const doc = await RestaurantSubscriptionModel.findOneAndUpdate(
      notDeletedFilter({
        restaurantId: toObjectId(input.restaurantId),
      }) as Filter,
      {
        $set: cancelAtPeriodEnd
          ? {
              cancelAtPeriodEnd: true,
              cancelledAt: now,
              updatedBy: optionalRef(input.userId),
            }
          : {
              status: "cancelled",
              cancelAtPeriodEnd: false,
              cancelledAt: now,
              updatedBy: optionalRef(input.userId),
            },
      },
      { new: true }
    ).exec();

    if (!doc) {
      throw Object.assign(new Error("NO_SUBSCRIPTION"), {
        code: "NO_SUBSCRIPTION",
      });
    }

    if (current.providerSubscriptionId) {
      await getPaymentProvider().cancelSubscription({
        providerSubscriptionId: current.providerSubscriptionId,
        atPeriodEnd: cancelAtPeriodEnd,
      });
    }

    const plan = await resolvePlanMeta(doc.planId);
    if (!cancelAtPeriodEnd && plan) {
      await syncRestaurantScaffold(
        input.restaurantId,
        plan.slug,
        "cancelled"
      );
    }

    void periodEnd;
    void input.reason;
    return serializeSubscription(doc, plan);
  },

  async reverseCancellation(input: {
    restaurantId: string;
    userId?: string | null;
  }): Promise<RestaurantSubscription> {
    await connectToDatabase();
    const current = await this.getSubscription(input.restaurantId);
    if (!current) {
      throw Object.assign(new Error("NO_SUBSCRIPTION"), {
        code: "NO_SUBSCRIPTION",
      });
    }

    if (!current.cancelAtPeriodEnd) {
      return current;
    }

    const doc = await RestaurantSubscriptionModel.findOneAndUpdate(
      notDeletedFilter({
        restaurantId: toObjectId(input.restaurantId),
      }) as Filter,
      {
        $set: {
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          status:
            current.effectiveStatus === "trialing" ? "trialing" : "active",
          updatedBy: optionalRef(input.userId),
        },
      },
      { new: true }
    ).exec();

    if (!doc) {
      throw Object.assign(new Error("NO_SUBSCRIPTION"), {
        code: "NO_SUBSCRIPTION",
      });
    }

    const plan = await resolvePlanMeta(doc.planId);
    return serializeSubscription(doc, plan);
  },

  async renewSubscription(input: {
    restaurantId: string;
    billingCycle?: BillingCycle;
    userId?: string | null;
  }): Promise<RestaurantSubscription> {
    const current = await this.getSubscription(input.restaurantId);
    if (!current) {
      throw Object.assign(new Error("NO_SUBSCRIPTION"), {
        code: "NO_SUBSCRIPTION",
      });
    }
    const plan = await this.findPlanById(current.planId);
    if (!plan) {
      throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
    }

    // Renewal without payment provider: extend local subscription state only.
    // Do NOT mark payment as successful.
    const providerResult = await getPaymentProvider().createSubscription({
      restaurantId: input.restaurantId,
      planId: current.planId,
      billingCycle: input.billingCycle ?? current.billingCycle,
    });
    void providerResult;

    const cycle = input.billingCycle ?? current.billingCycle;
    const now = new Date();
    const end =
      cycle === "yearly" ? addMonths(now, 12) : addMonths(now, 1);

    const doc = await RestaurantSubscriptionModel.findOneAndUpdate(
      notDeletedFilter({
        restaurantId: toObjectId(input.restaurantId),
      }) as Filter,
      {
        $set: {
          status: "active",
          billingCycle: cycle,
          subscriptionStart: now,
          subscriptionEnd: end,
          currentPeriodStart: now,
          currentPeriodEnd: end,
          renewalDate: end,
          cancelledAt: null,
          cancelAtPeriodEnd: false,
          pendingPlanChange: null,
          gracePeriodEnd: null,
          trialStart: null,
          trialEnd: null,
          paymentStatus: "not_configured",
          updatedBy: optionalRef(input.userId),
        },
      },
      { new: true }
    ).exec();

    if (!doc) {
      throw Object.assign(new Error("NO_SUBSCRIPTION"), {
        code: "NO_SUBSCRIPTION",
      });
    }

    await syncRestaurantScaffold(input.restaurantId, plan.slug, "active");
    await this.createInvoiceDraft({
      restaurantId: input.restaurantId,
      subscriptionId: String(doc._id),
      planId: plan.id,
      amount: cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice,
      currency: plan.currency,
      billingCycle: cycle,
      periodStart: now,
      periodEnd: end,
      userId: input.userId,
      status: "open",
    });

    return serializeSubscription(doc, { name: plan.name, slug: plan.slug });
  },

  async createInvoiceDraft(input: {
    restaurantId: string;
    subscriptionId: string;
    planId: string;
    amount: number;
    currency: string;
    billingCycle: BillingCycle;
    periodStart: Date | null;
    periodEnd: Date | null;
    userId?: string | null;
    status?: InvoiceFoundation["status"];
  }): Promise<InvoiceFoundation> {
    await connectToDatabase();
    const now = new Date();
    const status = input.status ?? (input.amount <= 0 ? "paid" : "open");
    const doc = await InvoiceFoundationModel.create({
      restaurantId: toObjectId(input.restaurantId),
      subscriptionId: toObjectId(input.subscriptionId),
      planId: toObjectId(input.planId),
      invoiceNumber: invoiceNumber(now),
      amount: input.amount,
      currency: input.currency,
      status,
      billingCycle: input.billingCycle,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      paymentPlaceholder: "",
      refundPlaceholder: "",
      couponPlaceholder: "",
      taxPlaceholder: 0,
      issuedAt: now,
      paidAt: status === "paid" ? now : null,
      createdBy: optionalRef(input.userId),
    });
    return serializeInvoice(doc);
  },

  async listInvoices(
    restaurantId: string,
    limit = 20
  ): Promise<InvoiceFoundation[]> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) return [];
    const docs = await InvoiceFoundationModel.find(
      notDeletedFilter({ restaurantId: toObjectId(restaurantId) }) as Filter
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return docs.map((doc) => serializeInvoice(doc as never));
  },

  async getFeatureAccess(
    restaurantId: string
  ): Promise<FeatureAccess | null> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) return null;
    const doc = await FeatureAccessModel.findOne(
      notDeletedFilter({ restaurantId: toObjectId(restaurantId) }) as Filter
    )
      .lean()
      .exec();
    return doc ? serializeFeatureAccess(doc as never) : null;
  },

  async refreshUsage(restaurantId: string): Promise<UsageMetrics> {
    await connectToDatabase();
    const rid = toObjectId(restaurantId);
    const periodKey = currentPeriodKey();
    const tenant = notDeletedFilter({ restaurantId: rid }) as Filter;

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );

    const [
      users,
      branches,
      orders,
      menuItems,
      customers,
      inventoryItems,
      tables,
      existing,
    ] = await Promise.all([
      UserModel.countDocuments(tenant),
      BranchModel.countDocuments(tenant),
      OrderModel.countDocuments({
        ...tenant,
        createdAt: { $gte: monthStart },
      } as Filter),
      MenuItemModel.countDocuments(tenant),
      CustomerModel.countDocuments(tenant),
      IngredientModel.countDocuments(tenant),
      RestaurantTableModel.countDocuments(tenant),
      UsageMetricsModel.findOne(
        notDeletedFilter({ restaurantId: rid, periodKey }) as Filter
      ).exec(),
    ]);

    const payload = {
      users,
      branches,
      orders,
      menuItems,
      customers,
      inventoryItems,
      tables,
      storage: existing?.storage ?? 0,
      apiRequests: existing?.apiRequests ?? 0,
    };

    const doc = await UsageMetricsModel.findOneAndUpdate(
      notDeletedFilter({ restaurantId: rid, periodKey }) as Filter,
      {
        $set: payload,
        $setOnInsert: {
          restaurantId: rid,
          periodKey,
        },
      },
      { upsert: true, new: true }
    ).exec();

    return serializeUsage(doc);
  },

  async getUsage(restaurantId: string): Promise<UsageMetrics> {
    return this.refreshUsage(restaurantId);
  },

  async getDashboard(
    restaurantId: string
  ): Promise<SubscriptionDashboardSummary> {
    await this.ensureDefaultPlans();
    const [subscription, plans, invoices, usage, featureAccess] =
      await Promise.all([
        this.getSubscription(restaurantId),
        this.findPlans({ activeOnly: true }),
        this.listInvoices(restaurantId, 5),
        this.getUsage(restaurantId),
        this.getFeatureAccess(restaurantId),
      ]);

    const currentPlan = subscription
      ? (await this.findPlanById(subscription.planId)) ??
        plans.find((p) => p.id === subscription.planId) ??
        null
      : null;

    const limits = planToLimits(currentPlan);
    const access = buildAccessSnapshot({
      subscription,
      plan: currentPlan,
      usage,
      limits,
      featureAccess,
    });
    const periodEnd = subscription
      ? getSubscriptionPeriodEnd(subscription)
      : null;

    const higherPlans = currentPlan
      ? plans.filter((p) => p.monthlyPrice > currentPlan.monthlyPrice)
      : plans.filter((p) => p.monthlyPrice > 0);

    return {
      currentPlan,
      subscription,
      daysRemaining: daysRemaining(periodEnd),
      renewalDate: subscription?.renewalDate ?? periodEnd,
      usage,
      limits,
      featureAccess,
      recentInvoices: invoices,
      upgradeAvailable: higherPlans.length > 0,
      access,
      limitChecks: evaluateTenantLimits({
        limits,
        usage,
        tablesUsed: usage.tables,
      }),
    };
  },
};
