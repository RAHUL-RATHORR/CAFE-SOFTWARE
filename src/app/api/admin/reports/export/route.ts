import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/database";
import { ReportsService, ReportFilter } from "@/lib/reports/reports.service";
import { ExportService } from "@/lib/reports/export.service";
import { RestaurantModel } from "@/models/restaurant";
import { BranchModel } from "@/models/branch";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const format = searchParams.get("format");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const branchId = searchParams.get("branchId");

    if (!reportType || !format || !startDateParam || !endDateParam) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const filter: ReportFilter = {
      restaurantId,
      branchId: branchId || undefined,
      startDate: new Date(startDateParam),
      endDate: new Date(endDateParam),
      page: 1,
      limit: 10000, // Large limit for exports
    };

    let dataToExport: any[] = [];
    let reportName = "";

    switch (reportType) {
      case "sales-summary":
        dataToExport = await ReportsService.getSalesSummary(filter);
        reportName = "Sales Summary";
        break;
      case "sales-detail":
        dataToExport = (await ReportsService.getOrderReport(filter)).data;
        reportName = "Sales Details";
        break;
      case "payments":
        dataToExport = (await ReportsService.getPaymentReport(filter)).data;
        reportName = "Payments Report";
        break;
      case "gst":
        dataToExport = (await ReportsService.getTaxReport(filter)).data;
        reportName = "GST Summary";
        break;
      case "inventory":
        dataToExport = (await ReportsService.getStockMovementReport(filter)).data;
        reportName = "Inventory Movements";
        break;
      case "menu-performance":
        dataToExport = (await ReportsService.getMenuPerformanceReport(filter)).data;
        reportName = "Menu Performance";
        break;
      case "daily-closing":
        dataToExport = (await ReportsService.getDailyClosingReport(filter)).data;
        reportName = "Daily Closing";
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Fetch meta details for PDF
    let restaurantName = "Restaurant";
    let branchName = "All Branches";
    
    if (format === "pdf") {
      const restaurant = await RestaurantModel.findById(restaurantId).lean();
      if (restaurant) restaurantName = restaurant.name;
      
      if (branchId) {
        const branch = await BranchModel.findById(branchId).lean();
        if (branch) branchName = branch.name;
      }
    }

    const filename = `DineFlow_${reportName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      const csv = ExportService.generateCSV(dataToExport);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === "excel") {
      const buffer = await ExportService.generateExcel(dataToExport, reportName);
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    } else if (format === "pdf") {
      const buffer = await ExportService.generatePDF(dataToExport, reportName, {
        restaurantName,
        branchName,
        dateRange: `${startDateParam.split("T")[0]} to ${endDateParam.split("T")[0]}`,
      });
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error: any) {
    console.error("Report Export Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report export" },
      { status: 500 }
    );
  }
}
