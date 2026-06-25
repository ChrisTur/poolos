import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const start = Date.now()

  try {
    await db.$queryRaw`SELECT 1`
    const dbLatencyMs = Date.now() - start

    return NextResponse.json(
      {
        status: "ok",
        db: { status: "ok", latencyMs: dbLatencyMs },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        db: { status: "error", error: err instanceof Error ? err.message : "unknown" },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
