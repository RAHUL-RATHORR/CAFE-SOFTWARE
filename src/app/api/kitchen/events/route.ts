import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/database";
import { DEMO_RESTAURANT_ID } from "@/actions/categories/context";
import { subscribeKitchenChannel } from "@/lib/kitchen/realtime";
import type { KitchenRealtimePayload } from "@/types/kitchen";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const role = session.user.role;
  if (
    !hasPermission(role, ["kitchen.view", "kitchen.manage", "orders.view"], {
      mode: "any",
    })
  ) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const restaurantId =
    session.user.restaurantId && isValidObjectId(session.user.restaurantId)
      ? session.user.restaurantId
      : DEMO_RESTAURANT_ID;

  if (!restaurantId || !isValidObjectId(restaurantId)) {
    return new Response(JSON.stringify({ error: "No restaurant found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const branchParam =
    request.nextUrl.searchParams.get("branchId")?.trim() || null;

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "CONNECTED",
            restaurantId,
            branchId: branchParam,
            timestamp: new Date().toISOString(),
          })}\n\n`
        )
      );

      // Heartbeat every 15s to keep connection alive
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 15000);

      // Subscribe to real-time events for this restaurant/branch
      unsubscribe = subscribeKitchenChannel(
        restaurantId,
        branchParam,
        (payload: KitchenRealtimePayload) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
            );
          } catch {
            // Stream closed
          }
        }
      );
    },
    cancel() {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
