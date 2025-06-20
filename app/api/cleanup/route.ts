import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request or add authentication
    const authHeader = request.headers.get("authorization")

    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.cleanupExpiredReservations()

    return NextResponse.json({
      success: true,
      message: "Expired reservations cleaned up",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in cleanup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// This can be called by a cron job or scheduled function
export async function GET() {
  try {
    await db.cleanupExpiredReservations()

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in cleanup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
