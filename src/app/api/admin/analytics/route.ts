import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { AnalyticsService } from "@/lib/analytics";
import { isValidObjectId } from "@/lib/database";
import { connectToDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (!hasPermission(role, ["analytics.view", "admin", "owner"], { mode: "any" })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const restaurantId = session.user.restaurantId;
    if (!restaurantId || !isValidObjectId(restaurantId)) {
      return NextResponse.json({ error: "Invalid restaurant ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || undefined;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const type = searchParams.get("type");

    if (!startDateParam || !endDateParam || !type) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const filter = {
      restaurantId,
      branchId,
      startDate,
      endDate,
    };

    let data;

    switch (type) {
      case "overview":
        data = await AnalyticsService.getDashboardKPIs(filter);
        break;
      case "sales-trend":
        const interval = searchParams.get("interval") as any || "daily";
        data = await AnalyticsService.getSalesTrend(filter, interval);
        break;
      case "order-sources":
        data = await AnalyticsService.getOrderSourceBreakdown(filter);
        break;
      case "payment-methods":
        data = await AnalyticsService.getPaymentMethodBreakdown(filter);
        break;
      case "top-items":
        data = await AnalyticsService.getTopItems(filter);
        break;
      default:
        return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
