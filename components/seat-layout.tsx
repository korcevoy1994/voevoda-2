"use client"

import type { Seat, Zone } from "@/lib/types"
import { useCartStore } from "@/lib/cart-store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { useState } from "react"

interface SeatLayoutProps {
  zone: Zone
  seats: Seat[]
  onSeatSelect: (seat: Seat, zone: Zone) => void
  selectedSeats: Set<string>
}

const getSeatColor = (seat: Seat, isSelected: boolean) => {
  if (isSelected) return "#8B5CF6" // Selected
  if (seat.status === "sold") return "#EF4444" // Sold
  if (seat.status === "reserved") return "#F59E0B" // Reserved
  return "#10B981" // Available
}

export function SeatLayout({ zone, seats, onSeatSelect, selectedSeats }: SeatLayoutProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  if (!seats || seats.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Для этой зоны нет схемы расположения мест.</p>
      </div>
    )
  }

  // Группируем места по рядам для отображения меток
  const rows = seats.reduce<Record<string, { y_sum: number; count: number }>>((acc, seat) => {
    const rowName = String.fromCharCode(64 + seat.row_number);
    if (!acc[rowName]) {
      acc[rowName] = { y_sum: 0, count: 0 };
    }
    acc[rowName].y_sum += seat.y_coordinate;
    acc[rowName].count++;
    return acc;
  }, {});

  const rowLabels = Object.entries(rows).map(([name, { y_sum, count }]) => ({
    name,
    y: y_sum / count, // Средняя Y координата для центрирования метки по вертикали
  }));
  
  // Определяем границы для ViewBox и позиционирования меток
  const xCoords = seats.map(s => s.x_coordinate);
  const yCoords = seats.map(s => s.y_coordinate);
  const minSeatX = Math.min(...xCoords);
  const maxSeatX = Math.max(...xCoords);
  const minSeatY = Math.min(...yCoords);
  const maxSeatY = Math.max(...yCoords);
  
  const labelPadding = 40; // Отступ для меток рядов
  const viewPortPadding = 20;

  const viewBoxX = minSeatX - labelPadding - viewPortPadding;
  const viewBoxY = minSeatY - viewPortPadding;
  const viewBoxWidth = (maxSeatX - minSeatX) + (2 * labelPadding) + (2 * viewPortPadding);
  const viewBoxHeight = (maxSeatY - minSeatY) + (2 * viewPortPadding);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true)
    setDragStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDragging) return
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  const resetView = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const zoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 5))
  const zoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.5))

  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="text-xl font-bold text-center mb-6">
        Зона <span style={{ color: zone.color }}>{zone.name}</span>
      </h3>
      <TooltipProvider>
        <div 
          className="relative w-full h-[60vh] bg-gray-50 rounded-lg overflow-hidden cursor-grab"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
            <svg
              className="w-full h-full"
              viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
            >
              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
                {/* Метки рядов (слева и справа) */}
                {rowLabels.map(label => (
                  <g key={`label-${label.name}`} className="font-semibold text-gray-500 text-lg">
                     <text 
                        x={minSeatX - labelPadding} 
                        y={label.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {label.name}
                      </text>
                      <text 
                        x={maxSeatX + labelPadding} 
                        y={label.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {label.name}
                      </text>
                  </g>
                ))}

                {/* Места */}
                {seats.map(seat => {
                  const isSelected = selectedSeats.has(seat.id)
                  return (
                    <Tooltip key={seat.id}>
                      <TooltipTrigger asChild>
                        <g
                          onClick={() => {
                            if (seat.status === "available") onSeatSelect(seat, zone)
                          }}
                          className="cursor-pointer transition-transform duration-200 hover:scale-110"
                          style={{ transformOrigin: `${seat.x_coordinate}px ${seat.y_coordinate}px` }}
                        >
                          <rect
                            x={seat.x_coordinate - 8}
                            y={seat.y_coordinate - 8}
                            width="16"
                            height="16"
                            rx="3"
                            fill={getSeatColor(seat, isSelected)}
                            stroke={isSelected ? "#4F46E5" : "rgba(0,0,0,0.2)"}
                            strokeWidth="1"
                          />
                          <text
                            x={seat.x_coordinate}
                            y={seat.y_coordinate}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="9"
                            fill="white"
                            className="pointer-events-none font-semibold"
                          >
                            {seat.seat_number}
                          </text>
                        </g>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Ряд: {String.fromCharCode(64 + seat.row_number)}, Место: {seat.seat_number}
                        </p>
                        <p>Цена: {zone.price.toLocaleString("ru-RU")} ₽</p>
                        <p className="capitalize">Статус: {seat.status}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </g>
            </svg>
         {/* Элементы управления */}
         <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={zoomIn} className="bg-white">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Приблизить</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={zoomOut} className="bg-white">
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Отдалить</p>
              </TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" onClick={resetView} className="bg-white">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
              </TooltipTrigger>
               <TooltipContent>
                <p>Сбросить</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
} 