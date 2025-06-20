"use client"

import { Badge } from "@/components/ui/badge"

interface SeatAvailabilityProps {
  totalSeats: number
  availableSeats: number
  reservedSeats: number
  soldSeats: number
}

export function SeatAvailabilityIndicator({
  totalSeats,
  availableSeats,
  reservedSeats,
  soldSeats,
}: SeatAvailabilityProps) {
  const availablePercentage = (availableSeats / totalSeats) * 100

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-semibold mb-3">Доступность мест</h3>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm">Свободно</span>
          </div>
          <Badge variant="outline">{availableSeats}</Badge>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-sm">Забронировано</span>
          </div>
          <Badge variant="outline">{reservedSeats}</Badge>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm">Продано</span>
          </div>
          <Badge variant="outline">{soldSeats}</Badge>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            availablePercentage > 50 ? "bg-green-500" : availablePercentage > 20 ? "bg-yellow-500" : "bg-red-500"
          }`}
          style={{ width: `${availablePercentage}%` }}
        ></div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">{availablePercentage.toFixed(1)}% мест доступно</p>
    </div>
  )
}
