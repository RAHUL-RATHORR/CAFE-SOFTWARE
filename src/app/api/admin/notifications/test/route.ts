import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database";
import { NotificationService } from "@/lib/notification/notification.service";
import { hasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Explicit permission check
    if (!hasPermission(session.user.role, "notification:test") && session.user.role !== "restaurant-owner") {
      return NextResponse.json({ error: "Forbidden: Requires NOTIFICATION_TEST permission" }, { status: 403 });
    }

    const body = await request.json();
    const { channel, recipient, message } = body;

    if (!channel || !recipient || !message) {
      return NextResponse.json({ error: "Channel, recipient, and message are required" }, { status: 400 });
    }

    // Rate limiting could be applied here

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant context" }, { status: 400 });
    }

    // Dispatch the test notification synchronously to return immediate result
    const referenceKey = `TEST_MESSAGE:${Date.now()}`;
    
    // We await the dispatch to ensure the log is created and attempted
    await NotificationService.dispatch({
      eventType: "TEST_MESSAGE",
      restaurantId,
      branchId: (session.user as any).branchId,
      referenceKey,
      recipient: {
        email: channel === "EMAIL" ? recipient : null,
        phone: (channel === "WHATSAPP" || channel === "SMS") ? recipient : null,
      },
      variables: { message },
      channels: [channel],
    });

    return NextResponse.json({ success: true, message: "Test notification dispatched" });
  } catch (error: any) {
    console.error("Error sending test notification:", error);
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 });
  }
}
