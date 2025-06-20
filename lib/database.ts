import { createServerClient } from "./supabase"
import type { Event, Zone, Seat, Order } from "./types"

export class DatabaseService {
  private supabase = createServerClient()

  async getEvent(eventId?: string): Promise<Event | null> {
    try {
      let query = this.supabase.from("events").select("*")

      if (eventId) {
        query = query.eq("id", eventId)
      } else {
        query = query.limit(1)
      }

      const { data, error } = await query.single()

      if (error) {
        console.error("Error fetching event:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Database error:", error)
      return null
    }
  }

  async getZones(eventId: string): Promise<Zone[]> {
    try {
      const { data, error } = await this.supabase
        .from("zones")
        .select("*")
        .eq("event_id", eventId)
        .order("price", { ascending: false })

      if (error) {
        console.error("Error fetching zones:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Database error:", error)
      return []
    }
  }

  async getSeats(zoneId: string): Promise<Seat[]> {
    try {
      const { data, error } = await this.supabase
        .from("seats")
        .select("*")
        .eq("zone_id", zoneId)
        .order("row_number")
        .order("seat_number")

      if (error) {
        console.error("Error fetching seats:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Database error:", error)
      return []
    }
  }

  async getSeatWithZone(seatId: string) {
    try {
      const { data, error } = await this.supabase
        .from("seats")
        .select(`
          *,
          zones (*)
        `)
        .eq("id", seatId)
        .single()

      if (error) {
        console.error("Error fetching seat with zone:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Database error:", error)
      return null
    }
  }

  async reserveSeats(seatIds: string[], minutes = 10): Promise<boolean> {
    try {
      const reserveUntil = new Date(Date.now() + minutes * 60 * 1000)

      const { error } = await this.supabase
        .from("seats")
        .update({
          status: "reserved",
          reserved_until: reserveUntil.toISOString(),
        })
        .in("id", seatIds)
        .eq("status", "available")

      if (error) {
        console.error("Error reserving seats:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Database error:", error)
      return false
    }
  }

  async releaseSeats(seatIds: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("seats")
        .update({
          status: "available",
          reserved_until: null,
        })
        .in("id", seatIds)
        .eq("status", "reserved")

      if (error) {
        console.error("Error releasing seats:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Database error:", error)
      return false
    }
  }

  async createOrder(orderData: {
    user_name: string
    user_email: string
    user_phone?: string
    total_amount: number
    items: Array<{ seat_id: string; price: number }>
  }): Promise<{ order: Order | null; success: boolean }> {
    try {
      // Start transaction-like operation
      const { data: order, error: orderError } = await this.supabase
        .from("orders")
        .insert({
          user_name: orderData.user_name,
          user_email: orderData.user_email,
          user_phone: orderData.user_phone,
          total_amount: orderData.total_amount,
          status: "completed",
        })
        .select()
        .single()

      if (orderError) {
        console.error("Error creating order:", orderError)
        return { order: null, success: false }
      }

      // Create order items
      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        seat_id: item.seat_id,
        price: item.price,
      }))

      const { error: itemsError } = await this.supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("Error creating order items:", itemsError)
        // In a real app, you'd want to rollback the order here
        return { order: null, success: false }
      }

      // Update seat status to sold
      const seatIds = orderData.items.map((item) => item.seat_id)
      const { error: seatsError } = await this.supabase
        .from("seats")
        .update({
          status: "sold",
          reserved_until: null,
        })
        .in("id", seatIds)

      if (seatsError) {
        console.error("Error updating seat status:", seatsError)
        // In a real app, you'd want to rollback here
      }

      return { order, success: true }
    } catch (error) {
      console.error("Database error:", error)
      return { order: null, success: false }
    }
  }

  async cleanupExpiredReservations(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("seats")
        .update({
          status: "available",
          reserved_until: null,
        })
        .eq("status", "reserved")
        .lt("reserved_until", new Date().toISOString())

      if (error) {
        console.error("Error cleaning up expired reservations:", error)
      }
    } catch (error) {
      console.error("Database error:", error)
    }
  }

  async getOrderWithDetails(orderId: string) {
    try {
      const { data, error } = await this.supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            seats (
              *,
              zones (*)
            )
          )
        `)
        .eq("id", orderId)
        .single()

      if (error) {
        console.error("Error fetching order details:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Database error:", error)
      return null
    }
  }
}

export const db = new DatabaseService()
