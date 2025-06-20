"use client"

import type { Zone } from "@/lib/types"

interface VenueMapProps {
  zones: Zone[]
  selectedZone: Zone | null
  onZoneSelect: (zone: Zone) => void
}

export function VenueMap({ zones, selectedZone, onZoneSelect }: VenueMapProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Схема зала</h3>
        <div className="w-32 h-4 bg-gray-800 mx-auto rounded mb-2"></div>
        <p className="text-sm text-muted-foreground">СЦЕНА</p>
      </div>

      <svg viewBox="0 0 600 800" className="w-full h-auto max-h-96 border rounded">
        {/* Stage */}
        <rect x="150" y="20" width="300" height="40" fill="#1f2937" rx="5" />
        <text x="300" y="45" textAnchor="middle" className="fill-white text-sm font-semibold">
          СЦЕНА
        </text>

        {/* VIP Zone */}
        <rect
          x="200"
          y="100"
          width="200"
          height="80"
          fill={zones.find((z) => z.name === "VIP")?.color || "#FFD700"}
          fillOpacity={selectedZone?.name === "VIP" ? 0.8 : 0.6}
          stroke={selectedZone?.name === "VIP" ? "#000" : "none"}
          strokeWidth="2"
          rx="5"
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const vipZone = zones.find((z) => z.name === "VIP")
            if (vipZone) onZoneSelect(vipZone)
          }}
        />
        <text x="300" y="145" textAnchor="middle" className="fill-black text-sm font-semibold pointer-events-none">
          VIP
        </text>

        {/* Партер */}
        <rect
          x="100"
          y="220"
          width="400"
          height="200"
          fill={zones.find((z) => z.name === "Партер")?.color || "#FF6B6B"}
          fillOpacity={selectedZone?.name === "Партер" ? 0.8 : 0.6}
          stroke={selectedZone?.name === "Партер" ? "#000" : "none"}
          strokeWidth="2"
          rx="5"
          className="cursor-pointer hover:opacity-80"
          onClick={() => {
            const parterZone = zones.find((z) => z.name === "Партер")
            if (parterZone) onZoneSelect(parterZone)
          }}
        />
        <text x="300" y="325" textAnchor="middle" className="fill-white text-lg font-semibold pointer-events-none">
          ПАРТЕР
        </text>

        {/* Balcony zones */}
        {zones
          .filter((z) => z.name.includes("Балкон"))
          .map((zone, index) => (
            <g key={zone.id}>
              <rect
                x={50 + index * 170}
                y="480"
                width="150"
                height="100"
                fill={zone.color}
                fillOpacity={selectedZone?.id === zone.id ? 0.8 : 0.6}
                stroke={selectedZone?.id === zone.id ? "#000" : "none"}
                strokeWidth="2"
                rx="5"
                className="cursor-pointer hover:opacity-80"
                onClick={() => onZoneSelect(zone)}
              />
              <text
                x={125 + index * 170}
                y="535"
                textAnchor="middle"
                className="fill-white text-sm font-semibold pointer-events-none"
              >
                {zone.name}
              </text>
            </g>
          ))}
      </svg>
    </div>
  )
}
