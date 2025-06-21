"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "./types"

interface CartStore {
  items: CartItem[]
  reservedSeats: Record<string, number> // seatId -> timestamp
  addItem: (item: CartItem) => void
  removeItem: (seatId: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  reserveSeat: (seatId: string) => void
  unreserveSeat: (seatId: string) => void
  checkReservationExpiry: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      reservedSeats: {},
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.seat.id === item.seat.id)
          if (existingItem) return state

          // Reserve the seat for 10 minutes
          const expiryTime = Date.now() + 10 * 60 * 1000
          const newReservedSeats = { ...state.reservedSeats }
          newReservedSeats[item.seat.id] = expiryTime

          return {
            items: [...state.items, item],
            reservedSeats: newReservedSeats,
          }
        })
      },
      removeItem: (seatId) => {
        set((state) => {
          const newReservedSeats = { ...state.reservedSeats }
          delete newReservedSeats[seatId]

          return {
            items: state.items.filter((item) => item.seat.id !== seatId),
            reservedSeats: newReservedSeats,
          }
        })
      },
      clearCart: () => set({ items: [], reservedSeats: {} }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price, 0)
      },
      getTotalItems: () => get().items.length,
      reserveSeat: (seatId) => {
        const expiryTime = Date.now() + 10 * 60 * 1000 // 10 minutes
        set((state) => {
          const newReservedSeats = { ...state.reservedSeats }
          newReservedSeats[seatId] = expiryTime
          return { reservedSeats: newReservedSeats }
        })
      },
      unreserveSeat: (seatId) => {
        set((state) => {
          const newReservedSeats = { ...state.reservedSeats }
          delete newReservedSeats[seatId]
          return { reservedSeats: newReservedSeats }
        })
      },
      checkReservationExpiry: () => {
        const now = Date.now()
        set((state) => {
          const newReservedSeats: Record<string, number> = {}
          const newItems = state.items.filter((item) => {
            const expiryTime = state.reservedSeats[item.seat.id]
            if (expiryTime && now < expiryTime) {
              newReservedSeats[item.seat.id] = expiryTime
              return true
            }
            return false
          })
          return { items: newItems, reservedSeats: newReservedSeats }
        })
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)
