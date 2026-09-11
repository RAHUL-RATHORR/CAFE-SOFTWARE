import { describe, it, expect } from "vitest";
import {
  calculateGstTaxBreakdown,
  calculateCashChange,
  validateSplitPayments,
  computeDiscountAmount,
} from "@/lib/billing";

describe("POS Billing Pricing & GST Engine", () => {
  describe("GST Calculation", () => {
    it("calculates intra-state 5% GST with equal CGST (2.5%) and SGST (2.5%)", () => {
      const breakdown = calculateGstTaxBreakdown({
        taxableAmount: 1000,
        taxRate: 5,
        taxMode: "exclusive",
        isInterState: false,
      });

      expect(breakdown.taxableAmount).toBe(1000);
      expect(breakdown.taxRate).toBe(5);
      expect(breakdown.cgstRate).toBe(2.5);
      expect(breakdown.cgstAmount).toBe(25);
      expect(breakdown.sgstRate).toBe(2.5);
      expect(breakdown.sgstAmount).toBe(25);
      expect(breakdown.igstAmount).toBe(0);
      expect(breakdown.totalTax).toBe(50);
      expect(breakdown.taxMode).toBe("exclusive");
      expect(breakdown.isInterState).toBe(false);
    });

    it("calculates inter-state 18% IGST without CGST or SGST", () => {
      const breakdown = calculateGstTaxBreakdown({
        taxableAmount: 500,
        taxRate: 18,
        taxMode: "exclusive",
        isInterState: true,
      });

      expect(breakdown.taxableAmount).toBe(500);
      expect(breakdown.taxRate).toBe(18);
      expect(breakdown.cgstAmount).toBe(0);
      expect(breakdown.sgstAmount).toBe(0);
      expect(breakdown.igstRate).toBe(18);
      expect(breakdown.igstAmount).toBe(90);
      expect(breakdown.totalTax).toBe(90);
      expect(breakdown.isInterState).toBe(true);
    });

    it("calculates inclusive GST correctly extracting base amount from total", () => {
      // 1050 inclusive of 5% GST -> base 1000, GST 50
      const breakdown = calculateGstTaxBreakdown({
        taxableAmount: 1050,
        taxRate: 5,
        taxMode: "inclusive",
        isInterState: false,
      });

      expect(breakdown.taxableAmount).toBe(1000);
      expect(breakdown.totalTax).toBe(50);
      expect(breakdown.cgstAmount).toBe(25);
      expect(breakdown.sgstAmount).toBe(25);
    });

    it("avoids 1 paisa rounding discrepancy on odd totals", () => {
      const breakdown = calculateGstTaxBreakdown({
        taxableAmount: 33.33,
        taxRate: 5,
        taxMode: "exclusive",
      });

      // Total tax: 33.33 * 0.05 = 1.6665 -> 1.67
      expect(breakdown.totalTax).toBe(1.67);
      expect(breakdown.cgstAmount + breakdown.sgstAmount).toBe(1.67);
    });
  });

  describe("Discount Calculation", () => {
    it("computes percentage discount correctly", () => {
      const discount = computeDiscountAmount(1000, "percentage", 10);
      expect(discount).toBe(100);
    });

    it("computes fixed amount discount correctly", () => {
      const discount = computeDiscountAmount(500, "fixed", 75);
      expect(discount).toBe(75);
    });

    it("caps fixed discount at subtotal to prevent negative totals", () => {
      const discount = computeDiscountAmount(200, "fixed", 500);
      expect(discount).toBe(200);
    });

    it("never returns negative discount for negative input", () => {
      const discount = computeDiscountAmount(200, "fixed", -50);
      expect(discount).toBe(0);
    });
  });

  describe("Cash Change Calculation", () => {
    it("computes exact change when cash received exceeds total", () => {
      const change = calculateCashChange(450, 500);
      expect(change.isValid).toBe(true);
      expect(change.changeAmount).toBe(50);
      expect(change.shortfall).toBe(0);
    });

    it("computes 0 change for exact cash payment", () => {
      const change = calculateCashChange(320, 320);
      expect(change.isValid).toBe(true);
      expect(change.changeAmount).toBe(0);
      expect(change.shortfall).toBe(0);
    });

    it("detects shortfall when cash received is less than total", () => {
      const change = calculateCashChange(500, 400);
      expect(change.isValid).toBe(false);
      expect(change.changeAmount).toBe(0);
      expect(change.shortfall).toBe(100);
    });
  });

  describe("Split Payment Validation", () => {
    it("validates split payment across Cash and UPI matching grand total", () => {
      const validation = validateSplitPayments(1000, [
        { method: "cash", amount: 400 },
        { method: "upi", amount: 600 },
      ]);

      expect(validation.isValid).toBe(true);
      expect(validation.totalPaid).toBe(1000);
      expect(validation.remainingDue).toBe(0);
    });

    it("flags shortfall when split tenders sum to less than total", () => {
      const validation = validateSplitPayments(1000, [
        { method: "cash", amount: 300 },
        { method: "card", amount: 500 },
      ]);

      expect(validation.isValid).toBe(false);
      expect(validation.totalPaid).toBe(800);
      expect(validation.remainingDue).toBe(200);
      expect(validation.error).toContain("Shortfall: ₹200");
    });

    it("rejects non-positive tender amounts", () => {
      const validation = validateSplitPayments(500, [
        { method: "cash", amount: 0 },
        { method: "upi", amount: 500 },
      ]);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe("Tender amounts must be positive");
    });
  });
});
