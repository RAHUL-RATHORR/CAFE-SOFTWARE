import { describe, expect, it } from "vitest";
import {
  computeGuestOrderTotals,
  unitPriceFromMenuItem,
  validateAndPriceCustomizations,
} from "@/lib/qr-ordering/pricing";
import { createGuestOrderSchema } from "@/lib/validators/qr-ordering";
import type { MenuItem } from "@/types/menu-item";
import type { TaxSettings } from "@/types/settings";

const baseItem: MenuItem = {
  id: "507f1f77bcf86cd799439011",
  restaurantId: "507f1f77bcf86cd799439012",
  branchId: null,
  categoryId: "507f1f77bcf86cd799439013",
  name: "Latte",
  slug: "latte",
  description: "",
  shortDescription: "",
  sku: "",
  image: "",
  gallery: [],
  price: 200,
  discountPrice: 180,
  taxRate: 0,
  preparationTime: 5,
  calories: null,
  isVeg: true,
  isAvailable: true,
  isFeatured: false,
  displayOrder: 1,
  tags: [],
  customizationGroups: [
    {
      id: "size",
      name: "Size",
      required: true,
      min: 1,
      max: 1,
      options: [
        { id: "reg", name: "Regular", priceDelta: 0, isAvailable: true },
        { id: "lrg", name: "Large", priceDelta: 40, isAvailable: true },
      ],
    },
    {
      id: "extra",
      name: "Extras",
      required: false,
      min: 0,
      max: 2,
      options: [
        { id: "shot", name: "Extra shot", priceDelta: 30, isAvailable: true },
        { id: "oat", name: "Oat milk", priceDelta: 25, isAvailable: false },
      ],
    },
  ],
  createdBy: null,
  updatedBy: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const taxSettings: TaxSettings = {
  id: "tax",
  restaurantId: baseItem.restaurantId,
  taxMode: "exclusive",
  roundingRule: "nearest",
  profiles: [
    {
      id: "default",
      name: "Default",
      gstPercent: 5,
      cgstPercent: 0,
      sgstPercent: 0,
      igstPercent: 0,
      vatPercent: 0,
      serviceChargePercent: 10,
      isDefault: true,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("QR ordering pricing", () => {
  it("uses discount price as unit base", () => {
    expect(unitPriceFromMenuItem(baseItem)).toBe(180);
  });

  it("validates required customization and prices deltas from catalog", () => {
    const result = validateAndPriceCustomizations({
      groups: baseItem.customizationGroups,
      selections: [
        { groupId: "size", optionIds: ["lrg"] },
        { groupId: "extra", optionIds: ["shot"] },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2);
    expect(result.rows.reduce((sum, row) => sum + row.priceDelta, 0)).toBe(70);
  });

  it("rejects missing required customization", () => {
    const result = validateAndPriceCustomizations({
      groups: baseItem.customizationGroups,
      selections: [],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects unavailable customization options", () => {
    const result = validateAndPriceCustomizations({
      groups: baseItem.customizationGroups,
      selections: [
        { groupId: "size", optionIds: ["reg"] },
        { groupId: "extra", optionIds: ["oat"] },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("ignores client money fields and recomputes tax/service from settings", () => {
    const customization = validateAndPriceCustomizations({
      groups: baseItem.customizationGroups,
      selections: [{ groupId: "size", optionIds: ["lrg"] }],
    });
    expect(customization.ok).toBe(true);
    if (!customization.ok) return;

    const totals = computeGuestOrderTotals({
      lines: [
        {
          unitPrice: unitPriceFromMenuItem(baseItem),
          quantity: 2,
          customizations: customization.rows,
          taxRate: 0,
        },
      ],
      taxSettings,
    });

    // (180 + 40) * 2 = 440
    expect(totals.subtotal).toBe(440);
    expect(totals.serviceCharge).toBe(44);
    expect(totals.tax).toBe(22);
    expect(totals.grandTotal).toBe(506);
  });
});

describe("createGuestOrderSchema security shape", () => {
  it("requires tableToken and idempotencyKey; menuItemId for every line", () => {
    const parsed = createGuestOrderSchema.safeParse({
      tableToken: "a".repeat(32),
      idempotencyKey: "idem-key-12345",
      guestName: "",
      guestPhone: "",
      items: [
        {
          key: "1",
          menuItemId: "507f1f77bcf86cd799439011",
          name: "Tampered name",
          price: 1,
          quantity: 1,
          customizations: [],
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects client-trusted restaurant/branch/table ids payload", () => {
    const parsed = createGuestOrderSchema.safeParse({
      restaurant: "slug",
      table: "T1",
      guestName: "A",
      items: [
        {
          key: "1",
          menuItemId: "507f1f77bcf86cd799439011",
          quantity: 1,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("sanitizes optional phone format when provided", () => {
    const bad = createGuestOrderSchema.safeParse({
      tableToken: "a".repeat(32),
      idempotencyKey: "idem-key-12345",
      guestPhone: "not-a-phone!!",
      items: [
        {
          key: "1",
          menuItemId: "507f1f77bcf86cd799439011",
          quantity: 1,
          customizations: [],
        },
      ],
    });
    expect(bad.success).toBe(false);

    const ok = createGuestOrderSchema.safeParse({
      tableToken: "a".repeat(32),
      idempotencyKey: "idem-key-12345",
      guestPhone: "+91 98765 43210",
      items: [
        {
          key: "1",
          menuItemId: "507f1f77bcf86cd799439011",
          quantity: 1,
          customizations: [],
        },
      ],
    });
    expect(ok.success).toBe(true);
  });
});
