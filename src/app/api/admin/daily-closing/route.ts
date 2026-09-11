import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { DailyClosingService } from "@/lib/closing";
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
    if (!hasPermission(role, ["daily_closing.view", "admin", "owner"], { mode: "any" })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const restaurantId = session.user.restaurantId;
    if (!restaurantId || !isValidObjectId(restaurantId)) {
      return NextResponse.json({ error: "Invalid restaurant ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const businessDateParam = searchParams.get("businessDate");

    if (!branchId || !businessDateParam) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const businessDate = new Date(businessDateParam);

    const data = await DailyClosingService.getCurrentStats(restaurantId, branchId, businessDate);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Daily Closing Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (!hasPermission(role, ["daily_closing.manage", "admin", "owner"], { mode: "any" })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const restaurantId = session.user.restaurantId;
    if (!restaurantId || !isValidObjectId(restaurantId)) {
      return NextResponse.json({ error: "Invalid restaurant ID" }, { status: 400 });
    }

    const body = await request.json();
    const { branchId, businessDate: businessDateParam, cashActual } = body;

    if (!branchId || !businessDateParam || cashActual === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const businessDate = new Date(businessDateParam);

    const closing = await DailyClosingService.closeDay({
      restaurantId,
      branchId,
      businessDate,
      cashActual: Number(cashActual),
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, data: closing });
  } catch (error: any) {
    console.error("Daily Closing Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
