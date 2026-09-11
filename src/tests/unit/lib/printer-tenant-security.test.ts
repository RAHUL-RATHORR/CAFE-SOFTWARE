import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock database connection
vi.mock("@/lib/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/database")>();
  return {
    ...actual,
    connectToDatabase: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock the Mongoose model for Printer
vi.mock("@/models/printer/printer.model", () => {
  return {
    PrinterModel: {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      updateOne: vi.fn(),
      updateMany: vi.fn(),
    },
  };
});

import { PrinterModel } from "@/models/printer/printer.model";
import { printerRepository } from "@/repositories/printer/printer.repository";
import { PrinterService } from "@/lib/printer/printer-service";
import { EscPosBuilder } from "@/lib/printer/escpos-builder";

describe("Thermal Printer Multi-Tenant Isolation & Hardware Decoupling", () => {
  const RESTAURANT_A = "507f1f77bcf86cd799439011";
  const RESTAURANT_B = "507f1f77bcf86cd799439022";
  const BRANCH_1 = "507f1f77bcf86cd799439033";
  const PRINTER_ID = "507f1f77bcf86cd799439044";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Multi-Tenant Boundary Enforcement", () => {
    it("strictly filters listPrinters by tenant restaurantId", async () => {
      const mockFind = vi.mocked(PrinterModel.find);
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof PrinterModel.find>);

      await printerRepository.listPrinters(RESTAURANT_A);

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantId: expect.anything(),
          isDeleted: false,
        })
      );
    });

    it("rejects getPrinterById when caller passes different restaurantId (cross-tenant attack)", async () => {
      const mockFindOne = vi.mocked(PrinterModel.findOne);
      mockFindOne.mockReturnValue({
        lean: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      } as unknown as ReturnType<typeof PrinterModel.findOne>);

      const result = await printerRepository.getPrinterById(PRINTER_ID, RESTAURANT_B);

      expect(result).toBeNull();
      expect(mockFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.anything(),
          restaurantId: expect.anything(),
        })
      );
    });

    it("atomically clears other defaults in the branch when creating a new default printer", async () => {
      const mockUpdateMany = vi.mocked(PrinterModel.updateMany);
      const mockCreate = vi.mocked(PrinterModel.create);

      mockUpdateMany.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      } as unknown as ReturnType<typeof PrinterModel.updateMany>);

      (
        mockCreate as unknown as { mockResolvedValue: (val: unknown) => void }
      ).mockResolvedValue({
        _id: PRINTER_ID,
        restaurantId: RESTAURANT_A,
        branchId: BRANCH_1,
        name: "New Counter Printer",
        type: "receipt",
        connectionType: "network",
        address: "192.168.1.100",
        port: 9100,
        paperWidth: "80mm",
        characterWidth: 48,
        autoCut: true,
        openCashDrawer: false,
        printLogo: false,
        printFooter: true,
        footerText: "Footer",
        autoPrint: true,
        isDefault: true,
        isActive: true,
        status: "unknown",
        lastVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ReturnType<typeof PrinterModel.create>);

      await printerRepository.createPrinter(RESTAURANT_A, {
        branchId: BRANCH_1,
        name: "New Counter Printer",
        connectionType: "network",
        address: "192.168.1.100",
        isDefault: true,
      });

      // Assert that sibling default printers were unset
      expect(mockUpdateMany).toHaveBeenCalledWith(
        {
          restaurantId: expect.anything(),
          branchId: expect.anything(),
          isDeleted: false,
        },
        { $set: { isDefault: false } }
      );
    });
  });

  describe("Printer Hardware Decoupling & Fault Tolerance", () => {
    it("returns FALLBACK_BROWSER gracefully when TCP socket fails, without crashing", async () => {
      // Mock socket failure
      vi.spyOn(PrinterService, "sendNetworkPrintJob").mockResolvedValue({
        success: false,
        error: "Connection timeout to 192.168.1.99:9100",
      });

      const builder = new EscPosBuilder();
      builder.text("Test Receipt");

      const result = await PrinterService.executePrintJob(
        {
          id: PRINTER_ID,
          restaurantId: RESTAURANT_A,
          branchId: BRANCH_1,
          name: "Kitchen Printer",
          type: "receipt",
          connectionType: "network",
          address: "192.168.1.99",
          port: 9100,
          paperWidth: "80mm",
          characterWidth: 48,
          autoCut: true,
          openCashDrawer: false,
          printLogo: false,
          printFooter: true,
          footerText: "Footer",
          autoPrint: false,
          isDefault: false,
          isActive: true,
          status: "unknown",
          lastVerifiedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        builder
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe("FALLBACK_BROWSER");
      expect(result.transport).toBe("browser");
      expect(result.error).toContain("timeout");
      expect(result.previewText).toBeDefined();
    });

    it("debounces rapid consecutive print requests for the same bill", async () => {
      const builder = new EscPosBuilder();
      builder.text("Debounced Receipt");

      const debounceKey = `bill_test_debounce_123`;

      // First call
      const res1 = await PrinterService.executePrintJob(null, builder, debounceKey);
      expect(res1.status).toBe("FALLBACK_BROWSER");

      // Immediate second call with same debounceKey
      const res2 = await PrinterService.executePrintJob(null, builder, debounceKey);
      expect(res2.status).toBe("QUEUED");
    });
  });
});
