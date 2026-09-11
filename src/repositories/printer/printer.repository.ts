import {
  connectToDatabase,
  toObjectId,
  isValidObjectId,
  notDeletedFilter,
} from "@/lib/database";
import {
  PrinterModel,
  type PrinterDocument,
} from "@/models/printer/printer.model";
import type {
  PrinterConfig,
  CreatePrinterInput,
  UpdatePrinterInput,
  PrinterStatus,
} from "@/types/printer";

type Filter = Record<string, unknown>;

function toPrinterConfig(doc: PrinterDocument): PrinterConfig {
  return {
    id: String(doc._id),
    restaurantId: String(doc.restaurantId),
    branchId: String(doc.branchId),
    name: doc.name,
    type: doc.type as PrinterConfig["type"],
    connectionType: doc.connectionType as PrinterConfig["connectionType"],
    address: doc.address,
    port: doc.port,
    paperWidth: doc.paperWidth as PrinterConfig["paperWidth"],
    characterWidth: doc.characterWidth,
    autoCut: Boolean(doc.autoCut),
    openCashDrawer: Boolean(doc.openCashDrawer),
    printLogo: Boolean(doc.printLogo),
    printFooter: Boolean(doc.printFooter),
    footerText: doc.footerText,
    autoPrint: Boolean(doc.autoPrint),
    isDefault: Boolean(doc.isDefault),
    isActive: Boolean(doc.isActive),
    status: (doc.status || "unknown") as PrinterStatus,
    lastVerifiedAt: doc.lastVerifiedAt ? doc.lastVerifiedAt.toISOString() : null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export class PrinterRepository {
  /**
   * List all active printers for a restaurant, optionally filtered by branch.
   */
  async listPrinters(
    restaurantId: string,
    branchId?: string
  ): Promise<PrinterConfig[]> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");

    const query: Filter = {
      restaurantId: toObjectId(restaurantId),
    };

    if (branchId && isValidObjectId(branchId)) {
      query.branchId = toObjectId(branchId);
    }

    const docs = await PrinterModel.find(notDeletedFilter(query) as Filter)
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()
      .exec();

    return (docs as unknown as PrinterDocument[]).map(toPrinterConfig);
  }

  /**
   * Get single printer by ID with tenant security check
   */
  async getPrinterById(
    id: string,
    restaurantId: string
  ): Promise<PrinterConfig | null> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return null;

    const doc = await PrinterModel.findOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter
    )
      .lean()
      .exec();

    if (!doc) return null;
    return toPrinterConfig(doc as unknown as PrinterDocument);
  }

  /**
   * Get default printer for a given restaurant and branch.
   * If no explicit default is found for the branch, returns the first active printer in the branch.
   */
  async getDefaultPrinter(
    restaurantId: string,
    branchId?: string
  ): Promise<PrinterConfig | null> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) return null;

    const query: Filter = {
      restaurantId: toObjectId(restaurantId),
      isActive: true,
    };

    if (branchId && isValidObjectId(branchId)) {
      query.branchId = toObjectId(branchId);
    }

    // Try finding default printer first
    let doc = await PrinterModel.findOne(
      notDeletedFilter({
        ...query,
        isDefault: true,
      }) as Filter
    )
      .lean()
      .exec();

    // Fallback: any active printer in branch
    if (!doc) {
      doc = await PrinterModel.findOne(notDeletedFilter(query) as Filter)
        .sort({ createdAt: 1 })
        .lean()
        .exec();
    }

    if (!doc) return null;
    return toPrinterConfig(doc as unknown as PrinterDocument);
  }

  /**
   * Create a new printer. If marked as default, atomically resets other defaults in same branch.
   */
  async createPrinter(
    restaurantId: string,
    input: CreatePrinterInput
  ): Promise<PrinterConfig> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");
    if (!isValidObjectId(input.branchId)) throw new Error("Invalid branch ID");

    // If marked as default, unmark other defaults in this branch
    if (input.isDefault) {
      await PrinterModel.updateMany(
        {
          restaurantId: toObjectId(restaurantId),
          branchId: toObjectId(input.branchId),
          isDeleted: false,
        },
        { $set: { isDefault: false } }
      ).exec();
    }

    const defaultCharWidth = input.paperWidth === "58mm" ? 32 : 48;

    const created = await PrinterModel.create({
      restaurantId: toObjectId(restaurantId),
      branchId: toObjectId(input.branchId),
      name: input.name.trim(),
      type: input.type || "receipt",
      connectionType: input.connectionType,
      address: input.address.trim(),
      port: input.port || 9100,
      paperWidth: input.paperWidth || "80mm",
      characterWidth: input.characterWidth || defaultCharWidth,
      autoCut: input.autoCut ?? true,
      openCashDrawer: input.openCashDrawer ?? false,
      printLogo: input.printLogo ?? false,
      printFooter: input.printFooter ?? true,
      footerText: input.footerText?.trim() || "Thank you for dining with us! Please visit again.",
      autoPrint: input.autoPrint ?? false,
      isDefault: input.isDefault ?? false,
      isActive: input.isActive ?? true,
      status: "unknown",
      lastVerifiedAt: null,
      isDeleted: false,
    });

    return toPrinterConfig(created as unknown as PrinterDocument);
  }

  /**
   * Update printer config. If marked default, unmarks siblings in the branch.
   */
  async updatePrinter(
    id: string,
    restaurantId: string,
    input: UpdatePrinterInput
  ): Promise<PrinterConfig | null> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return null;

    const filter: Filter = notDeletedFilter({
      _id: toObjectId(id),
      restaurantId: toObjectId(restaurantId),
    }) as Filter;

    const existing = await PrinterModel.findOne(filter).exec();
    if (!existing) return null;

    const branchId = input.branchId ? toObjectId(input.branchId) : existing.branchId;

    if (input.isDefault) {
      await PrinterModel.updateMany(
        {
          _id: { $ne: existing._id },
          restaurantId: toObjectId(restaurantId),
          branchId,
          isDeleted: false,
        },
        { $set: { isDefault: false } }
      ).exec();
    }

    const updateDoc: Record<string, unknown> = {};
    if (input.branchId && isValidObjectId(input.branchId)) updateDoc.branchId = toObjectId(input.branchId);
    if (input.name !== undefined) updateDoc.name = input.name.trim();
    if (input.type !== undefined) updateDoc.type = input.type;
    if (input.connectionType !== undefined) updateDoc.connectionType = input.connectionType;
    if (input.address !== undefined) updateDoc.address = input.address.trim();
    if (input.port !== undefined) updateDoc.port = input.port;
    if (input.paperWidth !== undefined) {
      updateDoc.paperWidth = input.paperWidth;
      if (!input.characterWidth) {
        updateDoc.characterWidth = input.paperWidth === "58mm" ? 32 : 48;
      }
    }
    if (input.characterWidth !== undefined) updateDoc.characterWidth = input.characterWidth;
    if (input.autoCut !== undefined) updateDoc.autoCut = input.autoCut;
    if (input.openCashDrawer !== undefined) updateDoc.openCashDrawer = input.openCashDrawer;
    if (input.printLogo !== undefined) updateDoc.printLogo = input.printLogo;
    if (input.printFooter !== undefined) updateDoc.printFooter = input.printFooter;
    if (input.footerText !== undefined) updateDoc.footerText = input.footerText.trim();
    if (input.autoPrint !== undefined) updateDoc.autoPrint = input.autoPrint;
    if (input.isDefault !== undefined) updateDoc.isDefault = input.isDefault;
    if (input.isActive !== undefined) updateDoc.isActive = input.isActive;

    const updated = await PrinterModel.findOneAndUpdate(
      filter,
      { $set: updateDoc },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) return null;
    return toPrinterConfig(updated as unknown as PrinterDocument);
  }

  /**
   * Set specific printer as default for its branch
   */
  async setDefaultPrinter(
    id: string,
    restaurantId: string
  ): Promise<PrinterConfig | null> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return null;

    const filter: Filter = notDeletedFilter({
      _id: toObjectId(id),
      restaurantId: toObjectId(restaurantId),
    }) as Filter;

    const printer = await PrinterModel.findOne(filter).exec();
    if (!printer) return null;

    // Unset other defaults in the branch
    await PrinterModel.updateMany(
      {
        _id: { $ne: printer._id },
        restaurantId: toObjectId(restaurantId),
        branchId: printer.branchId,
        isDeleted: false,
      },
      { $set: { isDefault: false } }
    ).exec();

    const updated = await PrinterModel.findOneAndUpdate(
      filter,
      { $set: { isDefault: true } },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) return null;
    return toPrinterConfig(updated as unknown as PrinterDocument);
  }

  /**
   * Soft delete a printer
   */
  async deletePrinter(id: string, restaurantId: string): Promise<boolean> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return false;

    const res = await PrinterModel.updateOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isDefault: false,
        },
      }
    ).exec();

    return res.modifiedCount > 0;
  }

  /**
   * Update printer connection status
   */
  async updatePrinterStatus(
    id: string,
    restaurantId: string,
    status: PrinterStatus
  ): Promise<void> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return;

    await PrinterModel.updateOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      {
        $set: {
          status,
          lastVerifiedAt: new Date(),
        },
      }
    ).exec();
  }
}

export const printerRepository = new PrinterRepository();
