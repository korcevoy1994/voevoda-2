import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { seatIds } = await request.json()

    if (!seatIds || !Array.isArray(seatIds)) {
      return NextResponse.json({ error: "Invalid seat IDs" }, { status: 400 })
    }

    const supabase = createServerClient()
    const reserveUntil = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Update seats to reserved status
    const { error } = await supabase
      .from("seats")
      .update({
        status: "reserved",
        reserved_until: reserveUntil.toISOString(),
      })
      .in("id", seatIds)
      .eq("status", "available")

    if (error) {
      console.error("Error reserving seats:", error)
      return NextResponse.json({ error: "Failed to reserve seats" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reserved_until: reserveUntil.toISOString(),
    })
  } catch (error) {
    console.error("Error in seat reservation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { seatIds } = await request.json()

    if (!seatIds || !Array.isArray(seatIds)) {
      return NextResponse.json({ error: "Invalid seat IDs" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Release seat reservations
    const { error } = await supabase
      .from("seats")
      .update({
        status: "available",
        reserved_until: null,
      })
      .in("id", seatIds)
      .eq("status", "reserved")

    if (error) {
      console.error("Error releasing seat reservations:", error)
      return NextResponse.json({ error: "Failed to release reservations" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in seat reservation release:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
