import { AuthError } from "@/components/auth/auth-error";
import { resolveBillingActor } from "@/actions/billing/context";
import { getPosBranches, getPosCatalog, getPosTables } from "@/actions/billing";
import { PosShell } from "@/components/pos";
import { connectToDatabase, notDeletedFilter, toObjectId } from "@/lib/database";
import { TaxSettingsModel } from "@/models/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "POS Terminal · DineFlow",
  description: "Point of Sale terminal for counter, dine-in, and takeaway orders",
};

export default async function PosPage() {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.create",
    "orders.create",
  ]);

  if (!actor.success) {
    if (actor.error.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    return <AuthError code="forbidden" />;
  }

  const branchResult = await getPosBranches();
  if (!branchResult.success || branchResult.data.branches.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4.25rem)] w-full items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-md">
          <h2 className="text-lg font-bold text-foreground">No Active Branch Configured</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Please create and activate at least one branch outlet in Branches settings before accessing the POS terminal.
          </p>
        </div>
      </div>
    );
  }

  const { branches, activeBranchId, canSwitchBranch } = branchResult.data;
  const currentBranchId = activeBranchId || branches[0].id;

  const [catalogResult, tablesResult] = await Promise.all([
    getPosCatalog(currentBranchId),
    getPosTables(currentBranchId),
  ]);

  await connectToDatabase();
  const taxSettings = await TaxSettingsModel.findOne(
    notDeletedFilter({ restaurantId: toObjectId(actor.data.restaurantId) })
  )
    .lean()
    .exec();

  const defaultProfile =
    (taxSettings?.profiles ?? []).find((p: { isDefault?: boolean }) => p.isDefault) ||
    taxSettings?.profiles?.[0];
  const taxRate = defaultProfile ? (defaultProfile as { gstPercent?: number }).gstPercent || 5 : 5;

  return (
    <PosShell
      branches={branches}
      initialBranchId={currentBranchId}
      canSwitchBranch={canSwitchBranch}
      initialCatalog={
        catalogResult.success
          ? catalogResult.data
          : { categories: [{ id: "all", name: "All" }], items: [] }
      }
      initialTables={tablesResult.success ? tablesResult.data : []}
      taxRate={taxRate}
    />
  );
}
