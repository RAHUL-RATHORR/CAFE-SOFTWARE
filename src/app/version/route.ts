import { NextResponse } from "next/server";
import { APP_NAME, getAppVersion, getBuildId } from "@/config/version";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public version endpoint providing non-sensitive release metadata.
 * GET /version
 */
export async function GET() {
  const response = NextResponse.json({
    name: APP_NAME,
    version: getAppVersion(),
    buildId: getBuildId(),
  });

  response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
  return response;
}
