import { EscPosBuilder } from "./escpos-builder";
import type { InvoicePrintData } from "@/types/billing";
import type { PrinterConfig, ThermalPaperWidth } from "@/types/printer";

export interface ReceiptFormatOptions {
  paperWidth?: ThermalPaperWidth;
  characterWidth?: number;
  autoCut?: boolean;
  openCashDrawer?: boolean;
  footerText?: string;
  isReprint?: boolean;
}

/**
 * Format currency in Indian Rupees notation
 */
function formatCurrency(amount: number): string {
  return "₹ " + Number(amount || 0).toFixed(2);
}

/**
 * Format a human-readable date & time
 */
function formatDateTime(isoOrDateStr?: string | null): string {
  if (!isoOrDateStr) return new Date().toLocaleString("en-IN");
  try {
    const d = new Date(isoOrDateStr);
    return isNaN(d.getTime()) ? String(isoOrDateStr) : d.toLocaleString("en-IN");
  } catch {
    return String(isoOrDateStr);
  }
}

/**
 * Generates an ESC/POS formatted receipt for a completed bill/invoice.
 * Supports both 58mm (32 characters) and 80mm (42 or 48 characters) widths.
 */
export function formatBillReceipt(
  invoice: InvoicePrintData,
  options: ReceiptFormatOptions = {}
): EscPosBuilder {
  const paperWidth = options.paperWidth || "80mm";
  const defaultCharWidth = paperWidth === "58mm" ? 32 : 48;
  const charWidth = options.characterWidth || defaultCharWidth;

  const builder = new EscPosBuilder({ characterWidth: charWidth });

  // 1. REPRINT WATERMARK (If applicable)
  if (options.isReprint) {
    builder
      .align("center")
      .bold(true)
      .text("*** DUPLICATE / REPRINT ***", true)
      .bold(false)
      .separator("-");
  }

  // 2. HEADER & BRANDING
  builder.align("center");
  // Restaurant Name: Double Size
  builder.size("double-both").bold(true).text(invoice.restaurantName || "RESTAURANT", true);
  builder.size("normal").bold(false);

  // Branch Name & Address
  if (invoice.branchName && invoice.branchName !== invoice.restaurantName) {
    builder.text(invoice.branchName, true);
  }
  if (invoice.branchAddress) {
    builder.text(invoice.branchAddress, true);
  }
  if (invoice.phone) {
    builder.text(`Tel: ${invoice.phone}`, true);
  }
  if (invoice.branchGstin || invoice.gstin) {
    builder.bold(true).text(`GSTIN: ${invoice.branchGstin || invoice.gstin}`, true).bold(false);
  }

  builder.separator("=");

  // 3. TAX INVOICE TITLE & METADATA
  builder
    .align("center")
    .bold(true)
    .text("TAX INVOICE", true)
    .bold(false)
    .separator("-");

  builder.twoColumns("Invoice No:", invoice.invoiceNumber);
  if (invoice.orderNumber) {
    builder.twoColumns("Order No:", `#${invoice.orderNumber}`);
  }
  builder.twoColumns("Date & Time:", formatDateTime(invoice.issuedAt));

  if (invoice.tableLabel) {
    builder.twoColumns("Table:", invoice.tableLabel);
  }
  builder.twoColumns("Order Type:", (invoice.orderType || "Dine-In").toUpperCase());
  if (invoice.cashierName) {
    builder.twoColumns("Cashier:", invoice.cashierName);
  }
  if (invoice.customerLabel) {
    builder.twoColumns("Customer:", invoice.customerLabel);
  }

  builder.separator("-");

  // 4. ITEMS TABLE
  // Header: QTY | ITEM NAME | AMOUNT
  const qtyHeader = "QTY".padEnd(4, " ");
  const amtHeader = "AMOUNT".padStart(9, " ");
  const itemHeader = "ITEM".padEnd(charWidth - qtyHeader.length - amtHeader.length, " ");
  builder.align("left").bold(true).text(`${qtyHeader}${itemHeader}${amtHeader}`, true).bold(false);
  builder.separator("-");

  for (const item of invoice.items) {
    const priceStr = formatCurrency(item.amount);
    const rateStr = item.quantity > 1 ? formatCurrency(item.rate) : undefined;
    builder.itemLine(item.quantity, item.name, priceStr, rateStr);

    // Customizations & Add-ons
    if (item.customizations && item.customizations.length > 0) {
      for (const custom of item.customizations) {
        builder.itemNote(custom);
      }
    }
    // Item notes
    if (item.notes) {
      builder.itemNote(`Note: ${item.notes}`);
    }
  }

  builder.separator("-");

  // 5. TOTALS & FINANCIAL SUMMARY
  builder.twoColumns("Subtotal:", formatCurrency(invoice.subtotal));

  if (invoice.discount > 0) {
    builder.twoColumns(`Discount (${invoice.discountLabel || "Promo"}):`, `-${formatCurrency(invoice.discount)}`);
  }

  // GST Breakdown
  if (invoice.gstBreakdown) {
    const { cgstAmount, sgstAmount, igstAmount, cgstRate, sgstRate, igstRate, isInterState, totalTax } =
      invoice.gstBreakdown;

    if (totalTax > 0) {
      if (isInterState && igstAmount > 0) {
        builder.twoColumns(`IGST (${igstRate}%):`, formatCurrency(igstAmount));
      } else {
        if (cgstAmount > 0) {
          builder.twoColumns(`CGST (${cgstRate}%):`, formatCurrency(cgstAmount));
        }
        if (sgstAmount > 0) {
          builder.twoColumns(`SGST (${sgstRate}%):`, formatCurrency(sgstAmount));
        }
      }
    }
  }

  if (invoice.serviceCharge && invoice.serviceCharge > 0) {
    builder.twoColumns("Service Charge:", formatCurrency(invoice.serviceCharge));
  }

  builder.separator("=");

  // GRAND TOTAL (Double Height)
  builder.size("double-height").bold(true);
  builder.twoColumns("GRAND TOTAL:", formatCurrency(invoice.grandTotal));
  builder.size("normal").bold(false);
  builder.separator("=");

  // 6. PAYMENT BREAKDOWN
  if (invoice.payments && invoice.payments.length > 0) {
    builder.bold(true).text("PAYMENTS:", true).bold(false);
    for (const p of invoice.payments) {
      const method = (p.method || "CASH").toUpperCase();
      builder.twoColumns(`  ${method}:`, formatCurrency(p.amount));
    }
  }

  if (invoice.changeGiven && invoice.changeGiven > 0) {
    builder.twoColumns("Change Returned:", formatCurrency(invoice.changeGiven));
  }

  builder.separator("-");

  // 7. FOOTER NOTE & POLICIES
  builder.align("center");
  const footer = options.footerText || invoice.footerNote || "Thank you for dining with us! Please visit again.";
  builder.text(footer, true);

  // DineFlow SaaS Attribution
  builder.feed(1);
  builder.text("Powered by DineFlow POS", true);

  // 8. CASH DRAWER & CUT
  if (options.openCashDrawer) {
    builder.cashDrawer();
  }

  if (options.autoCut !== false) {
    builder.cut(paperWidth === "58mm" ? 2 : 3);
  } else {
    builder.feed(3);
  }

  return builder;
}

/**
 * Format a printer hardware test receipt
 */
export function formatTestReceipt(printer: Partial<PrinterConfig>): EscPosBuilder {
  const paperWidth = printer.paperWidth || "80mm";
  const defaultCharWidth = paperWidth === "58mm" ? 32 : 48;
  const charWidth = printer.characterWidth || defaultCharWidth;

  const builder = new EscPosBuilder({ characterWidth: charWidth });

  builder.align("center");
  builder.size("double-both").bold(true).text("DINEFLOW POS", true);
  builder.size("normal").bold(false);
  builder.text("PRINTER HARDWARE TEST", true);
  builder.separator("=");

  builder.align("left");
  builder.twoColumns("Printer Name:", printer.name || "Thermal Printer");
  builder.twoColumns("Role / Type:", (printer.type || "receipt").toUpperCase());
  builder.twoColumns("Interface:", (printer.connectionType || "network").toUpperCase());
  builder.twoColumns("Address / IP:", printer.address || "127.0.0.1");
  if (printer.port) {
    builder.twoColumns("Port:", String(printer.port));
  }
  builder.twoColumns("Paper Width:", paperWidth);
  builder.twoColumns("Char Width:", `${charWidth} chars/line`);
  builder.twoColumns("Auto Cut:", printer.autoCut ? "ENABLED" : "DISABLED");
  builder.twoColumns("Cash Drawer:", printer.openCashDrawer ? "ENABLED" : "DISABLED");
  builder.twoColumns("Timestamp:", formatDateTime());

  builder.separator("-");
  builder.align("center");
  builder.text("Self-test diagnostic successful!", true);
  builder.text("Receipt printer is ready for POS billing.", true);

  builder.separator("=");

  if (printer.openCashDrawer) {
    builder.cashDrawer();
  }

  if (printer.autoCut !== false) {
    builder.cut(3);
  } else {
    builder.feed(3);
  }

  return builder;
}
