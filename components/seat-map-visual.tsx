"use client"

import { useState } from "react"
import type { Zone, Seat } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SeatMapVisualProps {
  zones: Zone[]
  seats: Seat[]
  selectedZone: Zone | null
  onZoneSelect: (zone: Zone) => void
  onSeatSelect?: (seat: Seat) => void
  selectedSeats?: Set<string>
}

export function SeatMapVisual({
  zones,
  seats,
  selectedZone,
  onZoneSelect,
  onSeatSelect,
  selectedSeats = new Set(),
}: SeatMapVisualProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null)

  // Calculate SVG dimensions based on seat coordinates
  const maxX = Math.max(...seats.map((s) => Number(s.x_coordinate) || 0), 600)
  const maxY = Math.max(...seats.map((s) => Number(s.y_coordinate) || 0), 1200)

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.has(seat.id)) return "#3B82F6" // blue
    if (hoveredSeat === seat.id) return "#8B5CF6" // purple

    switch (seat.status) {
      case "available":
        return "#10B981" // green
      case "reserved":
        return "#F59E0B" // yellow
      case "sold":
        return "#EF4444" // red
      default:
        return "#6B7280" // gray
    }
  }

  const getSeatOpacity = (seat: Seat) => {
    if (!selectedZone) return 0.3
    return seat.zone_id === selectedZone.id ? 1 : 0.2
  }

  const getZoneSeats = (zoneId: string) => {
    return seats.filter((seat) => seat.zone_id === zoneId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Схема зала</span>
          <div className="flex gap-2">
            {zones.map((zone) => (
              <Button
                key={zone.id}
                variant={selectedZone?.id === zone.id ? "default" : "outline"}
                size="sm"
                onClick={() => onZoneSelect(zone)}
                style={{
                  backgroundColor: selectedZone?.id === zone.id ? zone.color : undefined,
                  borderColor: zone.color,
                }}
              >
                {zone.name}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gray-50 rounded-lg p-4 overflow-auto">
          {/* Stage */}
          <div className="text-center mb-6">
            <div className="w-64 h-8 bg-gray-800 mx-auto rounded mb-2 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">СЦЕНА</span>
            </div>
          </div>

          {/* SVG Seat Map */}
          <svg
            width="100%"
            height="600"
            viewBox={`0 0 ${maxX + 100} ${maxY + 100}`}
            className="border rounded"
            style={{ minHeight: "400px" }}
          >
            {/* Zone backgrounds */}
            {zones.map((zone) => {
              const zoneSeats = getZoneSeats(zone.id)
              if (zoneSeats.length === 0) return null

              const minX = Math.min(...zoneSeats.map((s) => Number(s.x_coordinate)))
              const maxX = Math.max(...zoneSeats.map((s) => Number(s.x_coordinate)))
              const minY = Math.min(...zoneSeats.map((s) => Number(s.y_coordinate)))
              const maxY = Math.max(...zoneSeats.map((s) => Number(s.y_coordinate)))

              return (
                <rect
                  key={`zone-bg-${zone.id}`}
                  x={minX - 20}
                  y={minY - 20}
                  width={maxX - minX + 40}
                  height={maxY - minY + 40}
                  fill={zone.color}
                  fillOpacity={selectedZone?.id === zone.id ? 0.1 : 0.05}
                  stroke={zone.color}
                  strokeWidth={selectedZone?.id === zone.id ? 2 : 1}
                  strokeOpacity={0.3}
                  rx={10}
                  className="cursor-pointer"
                  onClick={() => onZoneSelect(zone)}
                />
              )
            })}

            {/* Zone labels */}
            {zones.map((zone) => {
              const zoneSeats = getZoneSeats(zone.id)
              if (zoneSeats.length === 0) return null

              const centerX = zoneSeats.reduce((sum, s) => sum + Number(s.x_coordinate), 0) / zoneSeats.length
              const centerY = zoneSeats.reduce((sum, s) => sum + Number(s.y_coordinate), 0) / zoneSeats.length

              return (
                <text
                  key={`zone-label-${zone.id}`}
                  x={centerX}
                  y={centerY - 30}
                  textAnchor="middle"
                  className="fill-gray-700 text-sm font-semibold pointer-events-none"
                >
                  {zone.name}
                </text>
              )
            })}

            {/* Seats */}
            {seats.map((seat) => (
              <circle
                key={seat.id}
                cx={Number(seat.x_coordinate)}
                cy={Number(seat.y_coordinate)}
                r={8}
                fill={getSeatColor(seat)}
                fillOpacity={getSeatOpacity(seat)}
                stroke="#fff"
                strokeWidth={1}
                className={`cursor-pointer transition-all duration-200 ${
                  seat.status === "available" ? "hover:r-10" : ""
                }`}
                onClick={() => {
                  if (seat.status === "available" && onSeatSelect) {
                    onSeatSelect(seat)
                  }
                }}
                onMouseEnter={() => setHoveredSeat(seat.id)}
                onMouseLeave={() => setHoveredSeat(null)}
              />
            ))}

            {/* Seat numbers (only for selected zone) */}
            {selectedZone &&
              seats
                .filter((seat) => seat.zone_id === selectedZone.id)
                .map((seat) => (
                  <text
                    key={`seat-number-${seat.id}`}
                    x={Number(seat.x_coordinate)}
                    y={Number(seat.y_coordinate) + 3}
                    textAnchor="middle"
                    className="fill-white text-xs font-bold pointer-events-none"
                    style={{ fontSize: "10px" }}
                  >
                    {seat.seat_number}
                  </text>
                ))}
          </svg>

          {/* Hover info */}
          {hoveredSeat && (
            <div className="absolute top-4 right-4 bg-black text-white p-2 rounded text-sm">
              {(() => {
                const seat = seats.find((s) => s.id === hoveredSeat)
                const zone = zones.find((z) => z.id === seat?.zone_id)
                return seat && zone ? `${zone.name} - Ряд ${seat.row_number}, Место ${seat.seat_number}` : ""
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
