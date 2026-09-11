import { connectToDatabase, toObjectId } from "@/lib/database";
import { InvoiceSettingsModel } from "@/models/settings";

/**
 * Atomic, concurrency-safe sequential invoice number generator.
 * Uses MongoDB $inc on the tenant's InvoiceSettings to guarantee strictly
 * monotonically increasing, collision-free invoice numbers even under concurrent POS checkouts.
 */
export async function generateNextInvoiceNumber(
  restaurantId: string,
  branchCode?: string | null
): Promise<string> {
  await connectToDatabase();

  const rId = toObjectId(restaurantId);

  const doc = await InvoiceSettingsModel.findOneAndUpdate(
    { restaurantId: rId },
    { $inc: { nextInvoiceNumber: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  const nextNumber = doc?.nextInvoiceNumber ?? 1;
  const rawPrefix = doc?.invoicePrefix?.trim() || "INV-";
  const cleanPrefix = rawPrefix.endsWith("-") ? rawPrefix : `${rawPrefix}-`;

  const paddedSequence = String(nextNumber).padStart(6, "0");

  if (branchCode && branchCode.trim()) {
    const cleanBranch = branchCode.trim().toUpperCase();
    return `${cleanBranch}-${cleanPrefix}${paddedSequence}`;
  }

  return `${cleanPrefix}${paddedSequence}`;
}
