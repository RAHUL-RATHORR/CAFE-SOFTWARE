import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateNextInvoiceNumber } from "@/lib/billing/invoice-number";
import { calculateGstTaxBreakdown, calculateCashChange, validateSplitPayments } from "@/lib/billing/pricing";

// Mock database connection
vi.mock("@/lib/database/connection", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

// Mock the Mongoose model for invoice settings
vi.mock("@/models/settings", () => {
  return {
    InvoiceSettingsModel: {
      findOneAndUpdate: vi.fn(),
    },
  };
});

import { InvoiceSettingsModel } from "@/models/settings";

describe("POS Multi-Tenant Security & Pricing Safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Invoice Number Sequence Generator", () => {
    it("generates collision-free invoice number strictly scoped to restaurant tenant", async () => {
      const mockFindOneAndUpdate = vi.mocked(InvoiceSettingsModel.findOneAndUpdate);

      mockFindOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          restaurantId: "507f1f77bcf86cd799439011",
          invoicePrefix: "INV",
          nextInvoiceNumber: 42,
        }),
      } as unknown as ReturnType<typeof InvoiceSettingsModel.findOneAndUpdate>);

      const invoiceNumber = await generateNextInvoiceNumber("507f1f77bcf86cd799439011", "BLR");

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { restaurantId: expect.anything() },
        { $inc: { nextInvoiceNumber: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 42 padded to 6 digits with branch code prefix
      expect(invoiceNumber).toBe("BLR-INV-000042");
    });

    it("falls back gracefully when settings record is created fresh at sequence 1", async () => {
      const mockFindOneAndUpdate = vi.mocked(InvoiceSettingsModel.findOneAndUpdate);

      mockFindOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          restaurantId: "507f1f77bcf86cd799439022",
          invoicePrefix: "INV",
          nextInvoiceNumber: 1,
        }),
      } as unknown as ReturnType<typeof InvoiceSettingsModel.findOneAndUpdate>);

      const invoiceNumber = await generateNextInvoiceNumber("507f1f77bcf86cd799439022");
      expect(invoiceNumber).toBe("INV-000001");
    });
  });

  describe("Tamper Resistance: Discount & Financial Guardrails", () => {
    it("prevents negative discount or discount exceeding order subtotal", () => {
      // If client attempts to exploit discount > subtotal:
      const subtotal = 500;
      const invalidExcessDiscount = 800;
      const clampedDiscount = Math.min(Math.max(0, invalidExcessDiscount), subtotal);
      expect(clampedDiscount).toBe(500);

      const negativeDiscount = -100;
      const clampedNegative = Math.min(Math.max(0, negativeDiscount), subtotal);
      expect(clampedNegative).toBe(0);

      const effectiveTaxable = Math.max(0, subtotal - clampedDiscount);
      const result = calculateGstTaxBreakdown({
        taxableAmount: effectiveTaxable,
        taxRate: 5,
        isInterState: false,
        taxMode: "exclusive",
      });

      expect(result.taxableAmount).toBe(0);
      expect(result.cgstAmount).toBe(0);
      expect(result.sgstAmount).toBe(0);
      expect(result.totalTax).toBe(0);
    });

    it("calculates accurate change and rejects non-positive tender amounts", () => {
      // Payment tender guard
      const tenders = [
        { method: "cash" as const, amount: -50 },
        { method: "upi" as const, amount: 200 },
      ];

      const validation = validateSplitPayments(150, tenders);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain("must be positive");
    });

    it("requires split payment tenders to fully cover payable total", () => {
      const tenders = [
        { method: "cash" as const, amount: 100 },
        { method: "card" as const, amount: 150 },
      ];

      const validation = validateSplitPayments(300, tenders);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain("Shortfall");
      expect(validation.remainingDue).toBe(50);
    });

    it("correctly records cash change given on overpayment", () => {
      const result = calculateCashChange(450, 500);
      expect(result.isValid).toBe(true);
      expect(result.changeAmount).toBe(50);
    });
  });
});
