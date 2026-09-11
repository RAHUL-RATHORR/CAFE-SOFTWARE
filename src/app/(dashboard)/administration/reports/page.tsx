import { Metadata } from "next";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/database/connection";
import { BranchModel } from "@/models/branch";
import { redirect } from "next/navigation";
import { ReportBuilder } from "@/components/reports/report-builder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reports & Exports | Admin",
};

export default async function ReportsPage() {
  await connectToDatabase();
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Need super-admin, owner or manager role.
  const allowedRoles = ["super-admin", "owner", "manager", "restaurant-owner"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  const branches = await BranchModel.find({
    restaurantId: session.user.restaurantId,
    isDeleted: false,
  })
    .select("name")
    .lean();

  const branchOptions = branches.map((b) => ({
    id: b._id.toString(),
    name: b.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports & Exports</h2>
        <p className="text-muted-foreground">
          Generate, preview, and download detailed business reports in PDF, Excel, and CSV formats.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Builder</CardTitle>
          <CardDescription>
            Select a report type and date range to preview data or generate an export.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportBuilder branches={branchOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
