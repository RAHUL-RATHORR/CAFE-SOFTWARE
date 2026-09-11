import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database";
import { MessageLogModel } from "@/models/notification/message-log.model";
import { hasPermission } from "@/lib/rbac";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user.role, "notification:read")) {
      // Return 403 or fallback to generic admin access checking
      // If notification:read isn't in RBAC yet, we check generic admin access
      if (!["super-admin", "restaurant-owner", "owner", "admin", "manager"].includes(session.user.role as any)) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const eventType = searchParams.get("eventType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant context" }, { status: 400 });
    }

    const query: any = { restaurantId: new Types.ObjectId(restaurantId) };

    // Strict branch isolation
    if (branchId) {
      query.branchId = new Types.ObjectId(branchId);
    } else if ((session.user as any).branchId) {
      query.branchId = new Types.ObjectId((session.user as any).branchId);
    }

    if (status) query.status = status;
    if (channel) query.channel = channel;
    if (eventType) query.eventType = eventType;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      MessageLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MessageLogModel.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching notification logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
