import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/database/connection";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const state = mongoose.connection.readyState;
    
    return NextResponse.json({
      status: state === 1 ? "connected" : "unhealthy",
      state
    }, { status: state === 1 ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      error: "Failed to check database connection"
    }, { status: 503 });
  }
}
