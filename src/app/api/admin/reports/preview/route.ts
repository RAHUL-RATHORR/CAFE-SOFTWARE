import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/database";
import { ReportsService, ReportFilter } from "@/lib/reports/reports.service";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role-based access control (check if they have reports.view permission)
    // For now, allow super-admin, owner, manager.
    const allowedRoles = ["super-admin", "owner", "manager", "restaurant-owner"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant context" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("reportType");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const branchId = searchParams.get("branchId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!reportType || !startDateParam || !endDateParam) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const filter: ReportFilter = {
      restaurantId,
      branchId: branchId || undefined,
      startDate: new Date(startDateParam),
      endDate: new Date(endDateParam),
      page,
      limit,
    };

    let result: any;
    switch (reportType) {
      case "sales-summary":
        result = { data: await ReportsService.getSalesSummary(filter), totalCount: 1, page: 1, limit: 1 };
        break;
      case "sales-detail":
        result = await ReportsService.getOrderReport(filter);
        break;
      case "payments":
        result = await ReportsService.getPaymentReport(filter);
        break;
      case "gst":
        result = await ReportsService.getTaxReport(filter);
        break;
      case "inventory":
        result = await ReportsService.getStockMovementReport(filter);
        break;
      case "menu-performance":
        result = await ReportsService.getMenuPerformanceReport(filter);
        break;
      case "daily-closing":
        result = await ReportsService.getDailyClosingReport(filter);
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Report Preview Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report preview" },
      { status: 500 }
    );
  }
}
