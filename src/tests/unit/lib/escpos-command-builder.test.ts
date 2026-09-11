import { describe, it, expect } from "vitest";
import { EscPosBuilder } from "@/lib/printer/escpos-builder";
import { formatBillReceipt, formatTestReceipt } from "@/lib/printer/receipt-formatter";
import type { InvoicePrintData } from "@/types/billing";

describe("ESC/POS Command Builder & Receipt Formatter", () => {
  describe("Binary ESC/POS Protocol Generator", () => {
    it("generates correct initialize byte sequence (ESC @: 0x1B, 0x40)", () => {
      const builder = new EscPosBuilder();
      const buf = builder.toBuffer();
      expect(buf[0]).toBe(0x1b);
      expect(buf[1]).toBe(0x40);
    });

    it("generates correct alignment byte sequences", () => {
      const builder = new EscPosBuilder();
      builder.align("left");
      builder.align("center");
      builder.align("right");
      const buf = builder.toBuffer();

      // Find center alignment: 0x1B, 0x61, 0x01
      let foundCenter = false;
      let foundRight = false;
      for (let i = 0; i < buf.length - 2; i++) {
        if (buf[i] === 0x1b && buf[i + 1] === 0x61 && buf[i + 2] === 0x01) foundCenter = true;
        if (buf[i] === 0x1b && buf[i + 1] === 0x61 && buf[i + 2] === 0x02) foundRight = true;
      }
      expect(foundCenter).toBe(true);
      expect(foundRight).toBe(true);
    });

    it("generates bold mode sequences (ESC E 1 / ESC E 0)", () => {
      const builder = new EscPosBuilder();
      builder.bold(true).bold(false);
      const buf = builder.toBuffer();

      let foundBoldOn = false;
      let foundBoldOff = false;
      for (let i = 0; i < buf.length - 2; i++) {
        if (buf[i] === 0x1b && buf[i + 1] === 0x45 && buf[i + 2] === 0x01) foundBoldOn = true;
        if (buf[i] === 0x1b && buf[i + 1] === 0x45 && buf[i + 2] === 0x00) foundBoldOff = true;
      }
      expect(foundBoldOn).toBe(true);
      expect(foundBoldOff).toBe(true);
    });

    it("generates character sizing commands (GS ! n)", () => {
      const builder = new EscPosBuilder();
      builder.size("double-height"); // 0x01
      builder.size("double-width"); // 0x10
      builder.size("double-both"); // 0x11
      const buf = builder.toBuffer();

      let foundDoubleBoth = false;
      for (let i = 0; i < buf.length - 2; i++) {
        if (buf[i] === 0x1d && buf[i + 1] === 0x21 && buf[i + 2] === 0x11) foundDoubleBoth = true;
      }
      expect(foundDoubleBoth).toBe(true);
    });

    it("generates paper cut command sequence (GS V 66 0: 0x1D, 0x56, 0x42, 0x00)", () => {
      const builder = new EscPosBuilder();
      builder.cut();
      const buf = builder.toBuffer();

      let foundCut = false;
      for (let i = 0; i < buf.length - 3; i++) {
        if (
          buf[i] === 0x1d &&
          buf[i + 1] === 0x56 &&
          buf[i + 2] === 0x42 &&
          buf[i + 3] === 0x00
        ) {
          foundCut = true;
        }
      }
      expect(foundCut).toBe(true);
    });

    it("generates cash drawer kick pulse (ESC p 0 25 250: 0x1B, 0x70, 0x00, 0x19, 0xFA)", () => {
      const builder = new EscPosBuilder();
      builder.cashDrawer();
      const buf = builder.toBuffer();

      let foundKick = false;
      for (let i = 0; i < buf.length - 4; i++) {
        if (
          buf[i] === 0x1b &&
          buf[i + 1] === 0x70 &&
          buf[i + 2] === 0x00 &&
          buf[i + 3] === 0x19 &&
          buf[i + 4] === 0xfa
        ) {
          foundKick = true;
        }
      }
      expect(foundKick).toBe(true);
    });
  });

  describe("Monospace Receipt Layout & Text Formatting", () => {
    it("formats two columns with exact character width padding for 58mm (32 chars)", () => {
      const builder = new EscPosBuilder({ characterWidth: 32 });
      builder.twoColumns("Subtotal", "₹ 450.00");
      const preview = builder.toPreviewText();
      const line = preview.split("\n")[0];

      expect(line.length).toBe(32);
      expect(line.startsWith("Subtotal")).toBe(true);
      expect(line.endsWith("₹ 450.00")).toBe(true);
    });

    it("formats two columns with exact character width padding for 80mm (48 chars)", () => {
      const builder = new EscPosBuilder({ characterWidth: 48 });
      builder.twoColumns("Grand Total", "₹ 1,250.00");
      const preview = builder.toPreviewText();
      const line = preview.split("\n")[0];

      expect(line.length).toBe(48);
      expect(line.startsWith("Grand Total")).toBe(true);
      expect(line.endsWith("₹ 1,250.00")).toBe(true);
    });

    it("wraps long item names across multiple lines cleanly without breaking alignment", () => {
      const builder = new EscPosBuilder({ characterWidth: 32 });
      builder.itemLine(2, "Super Deluxe Butter Paneer Masala Special", "₹ 540.00");
      const preview = builder.toPreviewText();
      const lines = preview.split("\n").filter(Boolean);

      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0].startsWith("2   ")).toBe(true);
      expect(lines[0].endsWith(" ₹ 540.00")).toBe(true);
      // Continuation line is indented
      expect(lines[1].startsWith("    ")).toBe(true);
    });
  });

  describe("Receipt Formatter (Authoritative GST Layout)", () => {
    const mockInvoice: InvoicePrintData = {
      invoiceNumber: "INV-2026-0001",
      orderNumber: "101",
      issuedAt: "2026-09-09T02:00:00.000Z",
      restaurantName: "DineFlow Gourmet Cafe",
      legalName: "DineFlow Foods Pvt Ltd",
      logo: "",
      address: "123 Market Street, Connaught Place",
      phone: "9876543210",
      email: "billing@dineflow.test",
      gstin: "07AAAAA0000A1Z5",
      branchName: "Central Delhi Branch",
      branchAddress: "Connaught Place, New Delhi",
      branchGstin: "07AAAAA0000A1Z5",
      tableLabel: "Table 4",
      orderType: "dine-in",
      customerLabel: null,
      customerPhone: null,
      cashierName: "Aman Sharma",
      items: [
        {
          name: "Cold Brew Coffee",
          quantity: 2,
          rate: 180,
          discount: 0,
          amount: 360,
          notes: "Extra ice",
          customizations: ["+Oat Milk"],
        },
        {
          name: "Avocado Sourdough Toast",
          quantity: 1,
          rate: 290,
          discount: 0,
          amount: 290,
        },
      ],
      subtotal: 650,
      discount: 50,
      discountLabel: "Welcome10",
      taxableAmount: 600,
      gstBreakdown: {
        taxableAmount: 600,
        taxRate: 5,
        cgstRate: 2.5,
        cgstAmount: 15,
        sgstRate: 2.5,
        sgstAmount: 15,
        igstRate: 0,
        igstAmount: 0,
        totalTax: 30,
        taxMode: "exclusive",
        isInterState: false,
      },
      serviceCharge: 0,
      grandTotal: 630,
      amountPaid: 630,
      changeGiven: 0,
      paymentStatus: "paid",
      payments: [
        {
          method: "cash",
          amount: 630,
          reference: "CASH_COLLECTED",
          timestamp: "2026-09-09T02:05:00.000Z",
        },
      ],
      footerNote: "Thank you for dining with us!",
    };

    it("generates complete 80mm receipt with tax breakdown, branding, and paper cut", () => {
      const builder = formatBillReceipt(mockInvoice, {
        paperWidth: "80mm",
        autoCut: true,
        openCashDrawer: true,
      });

      const preview = builder.toPreviewText();

      expect(preview).toContain("DineFlow Gourmet Cafe");
      expect(preview).toContain("TAX INVOICE");
      expect(preview).toContain("INV-2026-0001");
      expect(preview).toContain("Cold Brew Coffee");
      expect(preview).toContain("+Oat Milk");
      expect(preview).toContain("Extra ice");
      expect(preview).toContain("CGST (2.5%):");
      expect(preview).toContain("SGST (2.5%):");
      expect(preview).toContain("GRAND TOTAL:");
      expect(preview).toContain("[*** CASH DRAWER OPENED ***]");
      expect(preview).toContain("[=== PAPER CUT ===]");
    });

    it("includes duplicate / reprint banner when isReprint is true", () => {
      const builder = formatBillReceipt(mockInvoice, {
        paperWidth: "80mm",
        isReprint: true,
      });
      const preview = builder.toPreviewText();
      expect(preview).toContain("*** DUPLICATE / REPRINT ***");
    });

    it("generates self-test hardware diagnostic receipt", () => {
      const testBuilder = formatTestReceipt({
        name: "Kitchen Thermal",
        connectionType: "network",
        address: "192.168.1.150",
        port: 9100,
        paperWidth: "80mm",
        characterWidth: 48,
        autoCut: true,
        openCashDrawer: false,
      });

      const preview = testBuilder.toPreviewText();
      expect(preview).toContain("PRINTER HARDWARE TEST");
      expect(preview).toContain("Kitchen Thermal");
      expect(preview).toContain("192.168.1.150");
      expect(preview).toContain("9100");
      expect(preview).toContain("Self-test diagnostic successful!");
    });
  });
});
