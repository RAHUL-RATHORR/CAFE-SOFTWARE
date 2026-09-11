import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database";
import { NotificationTemplateModel } from "@/models/notification/template.model";
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

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const eventType = searchParams.get("eventType");

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant context" }, { status: 400 });
    }

    const query: any = { restaurantId: new Types.ObjectId(restaurantId) };

    if (channel) query.channel = channel;
    if (eventType) query.eventType = eventType;

    const templates = await NotificationTemplateModel.find(query).lean();

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["super-admin", "restaurant-owner", "owner", "admin"].includes(session.user.role as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant context" }, { status: 400 });
    }

    const body = await request.json();
    const { templateKey, channel, eventType, language, subject, body: content, variables, isActive } = body;

    // Check for duplicates
    const existing = await NotificationTemplateModel.findOne({
      restaurantId,
      templateKey,
      channel,
      language: language || "en"
    });

    if (existing) {
      return NextResponse.json({ error: "Template already exists for this key, channel and language" }, { status: 400 });
    }

    const template = await NotificationTemplateModel.create({
      restaurantId,
      templateKey,
      channel,
      eventType,
      language: language || "en",
      subject: subject || "",
      body: content,
      variables: variables || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: error.message || "Failed to create template" }, { status: 500 });
  }
}
