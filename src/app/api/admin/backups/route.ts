import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/database";
import { BackupService } from "@/lib/backups/backup.service";

// Store recent backup metadata in memory for the UI to display
// In a real production app, this would be stored in the database.
const recentBackups: any[] = [];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["super-admin", "owner", "restaurant-owner"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant context" }, { status: 400 });
    }

    // Return the recent backups for this restaurant
    const restaurantBackups = recentBackups.filter(b => b.restaurantId === restaurantId);

    return NextResponse.json({ data: restaurantBackups });
  } catch (error: any) {
    console.error("Fetch Backups Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch backups" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["super-admin", "owner", "restaurant-owner"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant context" }, { status: 400 });
    }

    // Create the backup metadata
    const newBackup = {
      id: Math.random().toString(36).substring(7),
      restaurantId,
      createdAt: new Date().toISOString(),
      createdBy: session.user.name || "Admin",
      version: 1,
      status: "COMPLETED",
      size: "Calculating...", // Not fully accurate before generation, but sufficient for UI
    };
    
    // In a real app we'd trigger the generation in a background job and store to S3
    // Here we will generate it synchronously, and return it directly since we don't have S3 configured.
    // The UI will initiate the download right after generation.
    
    const buffer = await BackupService.generateBackupBuffer(restaurantId);
    
    newBackup.size = (buffer.length / 1024 / 1024).toFixed(2) + " MB";
    recentBackups.unshift(newBackup);

    // Keep only last 10
    if (recentBackups.length > 10) recentBackups.pop();

    const filename = `DineFlow_Backup_${restaurantId}_${new Date().toISOString().split("T")[0]}.zip`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Backup-Id": newBackup.id,
      },
    });
  } catch (error: any) {
    console.error("Backup Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate backup" },
      { status: 500 }
    );
  }
}
