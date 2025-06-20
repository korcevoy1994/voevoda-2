"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/lib/cart-store"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, AlertTriangle } from "lucide-react"

export function ReservationTimer() {
  const { items, reservedSeats, checkReservationExpiry } = useCartStore()
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      checkReservationExpiry()

      if (items.length > 0) {
        const now = Date.now()
        const earliestExpiry = Math.min(...Array.from(reservedSeats.values()))
        const remaining = Math.max(0, earliestExpiry - now)
        setTimeLeft(remaining)
      } else {
        setTimeLeft(0)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [items, reservedSeats, checkReservationExpiry])

  if (items.length === 0 || timeLeft === 0) return null

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)
  const isUrgent = timeLeft < 2 * 60 * 1000 // Less than 2 minutes

  return (
    <Card className={`${isUrgent ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-600" />
          )}
          <div>
            <p className={`font-semibold ${isUrgent ? "text-red-700" : "text-yellow-700"}`}>
              Время бронирования: {minutes}:{seconds.toString().padStart(2, "0")}
            </p>
            <p className={`text-sm ${isUrgent ? "text-red-600" : "text-yellow-600"}`}>
              {isUrgent ? "Поторопитесь с оформлением!" : "Места забронированы для вас"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
