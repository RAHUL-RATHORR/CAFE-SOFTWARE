"use server";

import { revalidatePath } from "next/cache";
import { resolveBillingActor } from "@/actions/billing/context";
import { printerRepository } from "@/repositories/printer/printer.repository";
import { billRepository } from "@/repositories/billing/billing.repository";
import { formatBillReceipt, formatTestReceipt } from "@/lib/printer/receipt-formatter";
import { PrinterService } from "@/lib/printer/printer-service";
import type {
  CreatePrinterInput,
  UpdatePrinterInput,
  PrinterConfig,
  PrintJobResult,
  PrintReceiptInput,
} from "@/types/printer";

export type PrinterActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

function printerSuccess<T>(data: T): PrinterActionResult<T> {
  return { success: true, data };
}

function printerFailure(code: string, error: string): PrinterActionResult<never> {
  return { success: false, code, error };
}

/**
 * List printers for tenant, optionally filtered by branch.
 */
export async function listPrintersAction(
  branchId?: string
): Promise<PrinterActionResult<PrinterConfig[]>> {
  try {
    const actorRes = await resolveBillingActor(["billing.view", "settings.view"], branchId);
    if (!actorRes.success) {
      return printerFailure(actorRes.error.code, actorRes.error.message);
    }

    const targetBranchId = branchId || actorRes.data.branchId || undefined;
    const printers = await printerRepository.listPrinters(
      actorRes.data.restaurantId,
      targetBranchId
    );

    return printerSuccess(printers);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list printers";
    return printerFailure("INTERNAL_ERROR", msg);
  }
}

/**
 * Get a specific printer by ID
 */
export async function getPrinterAction(
  id: string
): Promise<PrinterActionResult<PrinterConfig | null>> {
  try {
    const actorRes = await resolveBillingActor(["billing.view", "settings.view"]);
    if (!actorRes.success) {
      return printerFailure(actorRes.error.code, actorRes.error.message);
    }

    const printer = await printerRepository.getPrinterById(id, actorRes.data.restaurantId);
    return printerSuccess(printer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to get printer";
    return printerFailure("INTERNAL_ERROR", msg);
  }
}

/**
 * Create a new thermal printer configuration
 */
export async function createPrinterAction(
  input: CreatePrinterInput
): Promise<PrinterActionResult<PrinterConfig>> {
  try {
    const actorRes = await resolveBillingActor(["settings.edit", "billing.manage"]);
    if (!actorRes.success) {
      return printerFailure(actorRes.error.code, actorRes.error.message);
    }

    if (!input.name || !input.name.trim()) {
      return printerFailure("VALIDATION_ERROR", "Printer name is required.");
    }
    if (!input.branchId) {
      return printerFailure("VALIDATION_ERROR", "Branch selection is required.");
    }
    if (!input.address || !input.address.trim()) {
      return printerFailure("VALIDATION_ERROR", "Printer IP address / Host is required.");
    }

    const printer = await printerRepository.createPrinter(actorRes.data.restaurantId, input);

    revalidatePath("/settings/printers");
    revalidatePath("/pos");

    return printerSuccess(printer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create printer";
    return printerFailure("INTERNAL_ERROR", msg);
  }
}

/**
 * Update an existing printer configuration
 */
export async function updatePrinterAction(
  id: string,
  input: UpdatePrinterInput
): Promise<PrinterActionResult<PrinterConfig>> {
  try {
    const actorRes = await resolveBillingActor(["settings.edit", "billing.manage"]);
    if (!actorRes.success) {
      return printerFailure(actorRes.error.code, actorRes.error.message);
    }

    const updated = await printerRepository.updatePrinter(
      id,
      actorRes.data.restaurantId,
      input
    );

    if (!updated) {
      return printerFailure("NOT_FOUND", "Printer not found or permission denied.");
    }

    revalidatePath("/settings/printers");
    revalidatePath("/pos");

    return printerSuccess(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update printer";
    return printerFailure("INTERNAL_ERROR", msg);
  }
}

/**
 * Soft delete a printer
 */
export async function deletePrinterAction(
  id: string
): Promise<PrinterActionResult<{ deleted: boolean }>> {
  try {
    const actorRes = await resolveBillingActor(["settings.edit", "billing.manage"]);
    if (!actorRes.success) {
      return printerFailure(actorRes.error.code, actorRes.error.message);
    }

    const ok = await printerRepository.deletePrinter(id, actorRes.data.restaurantId);
    if (!ok) {
      return printerFailure("NOT_FOUND", "Printer not found.");
    }

    revalidatePath("/settings/printers");
    revalidatePath("/pos");

    return printerSuccess({ deleted: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete printer";
    return printerFailure("INTERNAL_ERROR", msg);
  }
}

/**
 * Set a printer as default for its branch
 */
export async function setDefaultPrinterAction(
  id: string
): Promise<PrinterActionResult<PrinterConfig>> {
  try {
    const actorRes = await resolveBillingActor(["settings.edit", "billing.manage"]);
    if (!actorRes.success) {
      return printerFailure(actorRes.error.code, actorRes.error.message);
    }

    const printer = await printerRepository.setDefaultPrinter(id, actorRes.data.restaurantId);
    if (!printer) {
      return printerFailure("NOT_FOUND", "Printer not found.");
    }

    revalidatePath("/settings/printers");
    revalidatePath("/pos");

    return printerSuccess(printer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to set default printer";
    return printerFailure("INTERNAL_ERROR", msg);
  }
}

/**
 * Send a test print receipt or connectivity probe to the printer
 */
export async function testPrinterAction(
  printerIdOrConfig: string | Partial<PrinterConfig>
): Promise<PrinterActionResult<PrintJobResult>> {
  try {
    const actorRes = await resolveBillingActor(["settings.view", "billing.view"]);
    if (!actorRes.success) {
      return printerFailure(actorRes.error.code, actorRes.error.message);
    }

    let config: PrinterConfig | null = null;
    if (typeof printerIdOrConfig === "string") {
      config = await printerRepository.getPrinterById(
        printerIdOrConfig,
        actorRes.data.restaurantId
      );
      if (!config) {
        return printerFailure("NOT_FOUND", "Printer configuration not found.");
      }
    } else {
      config = {
        id: "test",
        restaurantId: actorRes.data.restaurantId,
        branchId: printerIdOrConfig.branchId || actorRes.data.branchId || "",
        name: printerIdOrConfig.name || "Test Printer",
        type: printerIdOrConfig.type || "receipt",
        connectionType: printerIdOrConfig.connectionType || "network",
        address: printerIdOrConfig.address || "127.0.0.1",
        port: printerIdOrConfig.port || 9100,
        paperWidth: printerIdOrConfig.paperWidth || "80mm",
        characterWidth: printerIdOrConfig.characterWidth || 48,
        autoCut: printerIdOrConfig.autoCut ?? true,
        openCashDrawer: printerIdOrConfig.openCashDrawer ?? false,
        printLogo: printerIdOrConfig.printLogo ?? false,
        printFooter: printerIdOrConfig.printFooter ?? true,
        footerText: printerIdOrConfig.footerText || "Test Footer",
        autoPrint: false,
        isDefault: false,
        isActive: true,
        status: "unknown",
        lastVerifiedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const testBuilder = formatTestReceipt(config);
    const result = await PrinterService.executePrintJob(config, testBuilder);

    // Update status in database if existing printer
    if (typeof printerIdOrConfig === "string") {
      await printerRepository.updatePrinterStatus(
        printerIdOrConfig,
        actorRes.data.restaurantId,
        result.success ? "connected" : "error"
      );
    }

    return printerSuccess(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Test print failed";
    return printerFailure("INTERNAL_ERROR", msg);
  }
}

/**
 * Print customer invoice / thermal bill receipt with ESC/POS formatting.
 * Guaranteed financial safety: Even if the printer is offline or fails,
 * this function will return fallback information with previewText and never invalidate the bill.
 */
export async function printReceiptAction(
  input: PrintReceiptInput
): Promise<PrinterActionResult<PrintJobResult>> {
  try {
    const actorRes = await resolveBillingActor(["billing.view", "billing.create"]);
    if (!actorRes.success) {
      return printerFailure(actorRes.error.code, actorRes.error.message);
    }

    const { billId, printerId, branchId, isReprint } = input;
    if (!billId) {
      return printerFailure("VALIDATION_ERROR", "Bill ID is required to print receipt.");
    }

    // 1. Fetch authoritative invoice print data
    const invoice = await billRepository.getInvoicePrintData(
      billId,
      actorRes.data.restaurantId
    );

    if (!invoice) {
      return printerFailure("NOT_FOUND", "Invoice data not found.");
    }

    // 2. Resolve printer config
    const targetBranchId = branchId || actorRes.data.branchId || undefined;
    let printer: PrinterConfig | null = null;

    if (printerId) {
      printer = await printerRepository.getPrinterById(printerId, actorRes.data.restaurantId);
    }
    if (!printer) {
      printer = await printerRepository.getDefaultPrinter(
        actorRes.data.restaurantId,
        targetBranchId
      );
    }

    // 3. Format receipt with 58mm or 80mm layout
    const builder = formatBillReceipt(invoice, {
      paperWidth: printer?.paperWidth || "80mm",
      characterWidth: printer?.characterWidth,
      autoCut: printer?.autoCut ?? true,
      openCashDrawer: printer?.openCashDrawer ?? false,
      footerText: printer?.footerText,
      isReprint: Boolean(isReprint),
    });

    // 4. Send to printer service with debounce protection
    const debounceKey = `bill_${billId}_${isReprint ? "reprint" : "print"}`;
    const result = await PrinterService.executePrintJob(printer, builder, debounceKey);

    return printerSuccess(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Print execution error";
    return printerFailure("PRINT_ERROR", msg);
  }
}

/**
 * Open Cash Drawer independently via ESC/POS command pulse
 */
export async function openCashDrawerAction(
  printerId?: string,
  branchId?: string
): Promise<PrinterActionResult<PrintJobResult>> {
  try {
    const actorRes = await resolveBillingActor(["billing.view", "billing.create"]);
    if (!actorRes.success) {
      return printerFailure(actorRes.error.code, actorRes.error.message);
    }

    let printer: PrinterConfig | null = null;
    if (printerId) {
      printer = await printerRepository.getPrinterById(printerId, actorRes.data.restaurantId);
    }
    if (!printer) {
      printer = await printerRepository.getDefaultPrinter(
        actorRes.data.restaurantId,
        branchId || actorRes.data.branchId || undefined
      );
    }

    const { EscPosBuilder } = await import("@/lib/printer/escpos-builder");
    const builder = new EscPosBuilder();
    builder.cashDrawer();

    const result = await PrinterService.executePrintJob(printer, builder);
    return printerSuccess(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Cash drawer trigger error";
    return printerFailure("INTERNAL_ERROR", msg);
  }
}
