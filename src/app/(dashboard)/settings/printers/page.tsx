import { auth } from "@/lib/auth/auth";
import { AuthError } from "@/components/auth/auth-error";
import { SettingsShell } from "@/components/settings";
import { PrinterSettingsShell } from "@/components/printer";
import { printerRepository } from "@/repositories/printer/printer.repository";
import { branchRepository } from "@/repositories/branch/branch.repository";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import { isValidObjectId } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function PrinterSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    return <AuthError code="session_expired" />;
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  // Fetch branches and printers
  const [branchesResult, printers] = await Promise.all([
    branchRepository.findMany(restaurantId, {
      status: "all",
      active: "all",
      page: 1,
      pageSize: 100,
      sortBy: "name",
      sortOrder: "asc",
    }),
    printerRepository.listPrinters(restaurantId),
  ]);

  const branchOptions = branchesResult.items.map((b) => ({
    id: b.id,
    name: b.name,
  }));

  if (branchOptions.length === 0) {
    branchOptions.push({
      id: "demo-branch",
      name: "Main Branch",
    });
  }

  return (
    <SettingsShell
      title="Thermal Printer Settings"
      description="Manage ESC/POS receipt printers (58mm/80mm), auto-cut, cash drawer kicks, and POS billing integrations"
    >
      <PrinterSettingsShell
        initialPrinters={printers}
        branches={branchOptions}
      />
    </SettingsShell>
  );
}
