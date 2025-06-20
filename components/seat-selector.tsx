"use client"

import { useState, useEffect } from "react"
import type { Zone, Seat } from "@/lib/types"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SeatSelectorProps {
  zone: Zone
  seats: Seat[]
}

export function SeatSelector({ zone, seats }: SeatSelectorProps) {
  const { items, addItem, removeItem } = useCartStore()
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Update selected seats from cart
    const cartSeatIds = new Set(items.map((item) => item.seat.id))
    setSelectedSeats(cartSeatIds)
  }, [items])

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== "available") return

    const isSelected = selectedSeats.has(seat.id)

    if (isSelected) {
      removeItem(seat.id)
    } else {
      addItem({
        seat,
        zone,
        price: zone.price,
      })
    }
  }

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.has(seat.id)) return "bg-blue-500 hover:bg-blue-600"

    switch (seat.status) {
      case "available":
        return "bg-green-500 hover:bg-green-600"
      case "reserved":
        return "bg-yellow-500"
      case "sold":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  const getSeatCursor = (seat: Seat) => {
    return seat.status === "available" ? "cursor-pointer" : "cursor-not-allowed"
  }

  // Group seats by rows
  const seatsByRow = seats.reduce(
    (acc, seat) => {
      if (!acc[seat.row_number]) {
        acc[seat.row_number] = []
      }
      acc[seat.row_number].push(seat)
      return acc
    },
    {} as Record<number, Seat[]>,
  )

  const rows = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Места в зоне "{zone.name}"</span>
          <span className="text-lg">{zone.price.toLocaleString("ru-RU")} ₽</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {rows.map((rowNumber) => (
            <div key={rowNumber} className="flex items-center gap-2">
              <div className="w-12 text-sm font-medium text-center">Ряд {rowNumber}</div>
              <div className="flex gap-1 flex-wrap">
                {seatsByRow[rowNumber]
                  .sort((a, b) => a.seat_number - b.seat_number)
                  .map((seat) => (
                    <Button
                      key={seat.id}
                      variant="outline"
                      size="sm"
                      className={`
                        w-8 h-8 p-0 text-xs font-medium text-white border-0
                        ${getSeatColor(seat)} ${getSeatCursor(seat)}
                      `}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status !== "available"}
                      title={`Ряд ${seat.row_number}, Место ${seat.seat_number} - ${zone.price.toLocaleString("ru-RU")} ₽`}
                    >
                      {seat.seat_number}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {seats.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Места в данной зоне не найдены</div>
        )}
      </CardContent>
    </Card>
  )
}
