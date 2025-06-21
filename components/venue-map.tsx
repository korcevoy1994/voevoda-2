"use client"

import { useState, useEffect } from "react"
import type { Zone, Seat } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

interface VenueMapProps {
  zones: Zone[]
  seats: Seat[]
  selectedZone: Zone | null
  onZoneSelect: (zone: Zone | null) => void
  onSeatSelect?: (seat: Seat) => void
  selectedSeats?: Set<string>
}

export function VenueMap({
  zones,
  seats,
  selectedZone,
  onZoneSelect,
  onSeatSelect,
  selectedSeats = new Set(),
}: VenueMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Сопоставляем данные из пропсов с картой зон для быстрого доступа
  const zonesMap = new Map(zones.map(z => [z.name, z]));

  // Определяем зоны точно как в оригинальном SVG
  const venueZones = [
    // VIP зоны (левая сторона) - с обновленными координатами для центрирования текста
    {
      id: "vip1",
      name: "VIP 1",
      path: "M7.6 64H38.6C42.8 64 46.2 67.4 46.2 71.6V184.4C46.2 188.6 42.8 192 38.6 192H7.6C3.4 192 0 188.6 0 184.4V71.6C0 67.4 3.4 64 7.6 64Z",
      color: "#FFB424",
      price: 15000,
      textX: 23,
      textY: 128,
      textRotation: -90,
    },
    {
      id: "vip2",
      name: "VIP 2",
      path: "M7.6 196H38.6C42.8 196 46.2 199.4 46.2 203.6V323.7C46.2 327.9 42.8 331.3 38.6 331.3H7.6C3.4 331.3 0 327.9 0 323.7V203.6C0 199.4 3.4 196 7.6 196Z",
      color: "#FFB424",
      price: 15000,
      textX: 23,
      textY: 264,
      textRotation: -90,
    },
    {
      id: "vip3",
      name: "VIP 3",
      path: "M7.6 335.4H38.6C42.8 335.4 46.2 338.8 46.2 343V465.6C46.2 469.8 42.8 473.2 38.6 473.2H7.6C3.4 473.2 0 469.8 0 465.6V343C0 338.8 3.4 335.4 7.6 335.4Z",
      color: "#D2D3D3",
      price: 12000,
      textX: 23,
      textY: 404,
      textRotation: -90,
    },
    {
      id: "vip4",
      name: "VIP 4",
      path: "M59.2 608.5C56.1 611.6 51.1 611.4 48.3 608.2C17.8 574.2 1.80001 531.2 0.200005 486.4C0.100005 483.6 -0.399995 477.4 6.50001 477.4H39.2C43.2 477.4 46.4 480.5 46.7 484.5C48.8 517.5 60.9 549.1 83.3 574.5C85.9 577.5 85.7 582 83 584.8L59.2 608.5Z",
      color: "#FFB424",
      price: 15000,
      textX: 43,
      textY: 544,
      textRotation: 69.8549,
    },
    {
      id: "vip5",
      name: "VIP 5",
      path: "M96.1 587.3C109 598.7 123.5 607.4 138.9 613.5C142.6 615 144.5 619 143.3 622.8L133.1 654C131.8 658.1 127.3 660.2 123.3 658.8C101.2 650.8 80.5 638.7 62.4 622.4C59.2 619.5 59 614.5 62.1 611.4L85.8 587.7C88.6 584.9 93.1 584.7 96.1 587.3Z",
      color: "#D2D3D3",
      price: 12000,
      textX: 101,
      textY: 621,
      textRotation: 30.402,
    },
    {
      id: "vip6",
      name: "VIP 6",
      path: "M138.5 655.4L148.1 624.5C149.3 620.7 153.2 618.4 157.1 619.4C167.6 622.1 178.4 624.2 189.3 624.2C196.1 624.2 197.4 628.1 197.4 633.7V661.5C197.4 669.5 193.7 670.7 188.8 670.5C173.6 669.7 158.6 668.4 144 664.9C139.8 664 137.2 659.6 138.5 655.4Z",
      color: "#FFB424",
      price: 15000,
      textX: 167,
      textY: 644,
      textRotation: 5.9376,
    },
    {
      id: "vip7",
      name: "VIP 7",
      path: "M209.1 624.3L311.5 624.5C315.7 624.5 319 627.9 319 632V663.2C319 667.4 315.6 670.8 311.4 670.7C296.8 670.6 229.8 670.5 209 670.5C204.8 670.5 201.5 667.1 201.5 663V631.9C201.5 627.7 204.9 624.3 209.1 624.3Z",
      color: "#FFB424",
      price: 15000,
      textX: 260,
      textY: 647,
      textRotation: 0,
    },
    {
      id: "vip8",
      name: "VIP 8",
      path: "M519.5 624.3L417.6 624.5C413.4 624.5 410.1 627.9 410.1 632V663.2C410.1 667.4 413.5 670.8 417.7 670.7C432.3 670.6 498.7 670.5 519.6 670.5C523.8 670.5 527.1 667.1 527.1 663V631.9C527.1 627.7 523.7 624.3 519.5 624.3Z",
      color: "#FFB424",
      price: 15000,
      textX: 469,
      textY: 647,
      textRotation: 0,
    },
    {
      id: "vip9",
      name: "VIP 9",
      path: "M590.1 655.4L580.5 624.5C579.3 620.7 575.4 618.4 571.5 619.4C561 622.1 550.2 624.2 539.3 624.2C532.5 624.2 531.1 628.1 531.1 633.7V661.5C531.1 669.5 534.8 670.7 539.8 670.5C555 669.7 570 668.4 584.6 664.9C588.9 664 591.4 659.6 590.1 655.4Z",
      color: "#FFB424",
      price: 15000,
      textX: 561,
      textY: 644,
      textRotation: -6.61963,
    },
    {
      id: "vip10",
      name: "VIP 10",
      path: "M632.6 587.3C619.7 598.7 605.2 607.4 589.8 613.5C586.1 615 584.2 619 585.4 622.8L595.5 654C596.8 658.1 601.3 660.2 605.3 658.8C627.4 650.8 648.1 638.7 666.2 622.4C669.4 619.5 669.6 614.5 666.5 611.4L642.8 587.7C640 584.9 635.5 584.7 632.6 587.3Z",
      color: "#FFB424",
      price: 15000,
      textX: 626,
      textY: 622,
      textRotation: -29.2431,
    },
    {
      id: "vip11",
      name: "VIP 11",
      path: "M669.4 608.5C672.5 611.6 677.5 611.4 680.3 608.2C710.8 574.2 726.7 531.2 728.4 486.4C728.5 483.6 729 477.4 722.1 477.4H689.4C685.4 477.4 682.2 480.5 681.9 484.5C679.8 517.5 667.7 549.1 645.3 574.5C642.7 577.5 642.8 582 645.6 584.8L669.4 608.5Z",
      color: "#FFB424",
      price: 15000,
      textX: 686,
      textY: 544,
      textRotation: -63.7686,
    },
    {
      id: "vip12",
      name: "VIP 12",
      path: "M690 314.5H721C725.2 314.5 728.6 317.9 728.6 322.1V465.9C728.6 470.1 725.2 473.5 721 473.5H690C685.8 473.5 682.4 470.1 682.4 465.9V322.1C682.4 317.9 685.8 314.5 690 314.5Z",
      color: "#FFB424",
      price: 15000,
      textX: 705,
      textY: 394,
      textRotation: -90,
    },
    {
      id: "vip13",
      name: "VIP 13",
      path: "M690 206.2H721C725.2 206.2 728.6 209.6 728.6 213.8V302.8C728.6 307 725.2 310.4 721 310.4H690C685.8 310.4 682.4 307 682.4 302.8V213.8C682.4 209.6 685.8 206.2 690 206.2Z",
      color: "#D2D3D3",
      price: 12000,
      textX: 705,
      textY: 258,
      textRotation: -90,
    },
    {
      id: "vip14",
      name: "VIP 14",
      path: "M690 64H721C725.2 64 728.6 67.4 728.6 71.6V194.6C728.6 198.8 725.2 202.2 721 202.2H690C685.8 202.2 682.4 198.8 682.4 194.6V71.6C682.4 67.4 685.8 64 690 64Z",
      color: "#FFB424",
      price: 15000,
      textX: 705,
      textY: 133,
      textRotation: -90,
    },
    // Балконные зоны
    {
      id: "201",
      name: "201",
      path: "M57.4 64H146.9C150.8 64 154 67.2 154 71.1V160.6C154 164.5 150.8 167.7 146.9 167.7H57.4C53.5 167.7 50.3 164.5 50.3 160.6V71.1C50.3 67.2 53.5 64 57.4 64Z",
      color: "#4ED784",
      price: 8000,
      textX: 102,
      textY: 116,
      textRotation: 0
    },
    {
      id: "202",
      name: "202",
      path: "M57.4 171.7H146.9C150.8 171.7 154 174.9 154 178.8V268.3C154 272.2 150.8 275.4 146.9 275.4H57.4C53.5 275.4 50.3 272.2 50.3 268.3V178.8C50.3 174.9 53.5 171.7 57.4 171.7Z",
      color: "#A49EFD",
      price: 7000,
      textX: 102,
      textY: 224,
      textRotation: 0
    },
    {
      id: "203",
      name: "203",
      path: "M57.4 279.5H146.9C150.8 279.5 154 282.7 154 286.6V376.1C154 380 150.8 383.2 146.9 383.2H57.4C53.5 383.2 50.3 380 50.3 376.1V286.6C50.3 282.7 53.5 279.5 57.4 279.5Z",
      color: "#D06EE9",
      price: 7000,
      textX: 102,
      textY: 332,
      textRotation: 0
    },
    {
      id: "204",
      name: "204",
      path: "M64.1 516.9C59.9 518.2 55.6 515.7 54.5 511.5C51.7 500.2 50.2 488.4 50.2 476.2V394.8C50.2 390.6 53.6 387.2 57.8 387.2H146.2C150.4 387.2 153.8 390.6 153.8 394.8V476.2C153.8 478.4 154 480.5 154.3 482.6C154.8 486.2 152.5 489.7 149 490.8L64.1 516.9Z",
      color: "#D06EE9",
      price: 7000,
      textX: 102,
      textY: 440,
      textRotation: 0
    },
    {
      id: "205",
      name: "205",
      path: "M160.6 496.5C164.1 502 168.7 506.6 174.2 510.1C177.1 511.9 178.4 515.5 177.3 518.8L149.4 603.9C148 608.1 143.3 610.3 139.2 608.5C104.6 593.6 77 565.8 62.1 531.3C60.3 527.2 62.5 522.5 66.7 521.1L151.8 493.4C155.1 492.3 158.7 493.6 160.6 496.5Z",
      color: "#F1F298",
      price: 6000,
      textX: 118,
      textY: 550,
      textRotation: 0
    },
    {
      id: "206",
      name: "206",
      path: "M180.1 521.5C181.2 517.9 184.8 515.8 188.5 516.4C190.7 516.7 192.9 516.9 195.1 516.9H277C281.2 516.9 284.6 520.3 284.6 524.5V612.9C284.6 617.1 281.2 620.5 277 620.5H195.1C182.7 620.5 170.7 619 159.2 616.1C155 615.1 152.5 610.7 153.8 606.5L180.1 521.5Z",
      color: "#FF6877",
      price: 6000,
      textX: 230,
      textY: 568,
      textRotation: 0
    },
    {
      id: "207",
      name: "207",
      path: "M296.1 516.6H432.5C436.7 516.6 440.1 520 440.1 524.2V613.2C440.1 617.4 436.7 620.8 432.5 620.8H296.1C291.9 620.8 288.5 617.4 288.5 613.2V524.2C288.5 520 291.9 516.6 296.1 516.6Z",
      color: "#FF6877",
      price: 6000,
      textX: 364,
      textY: 568,
      textRotation: 0
    },
    {
      id: "208",
      name: "208",
      path: "M548.6 521.5C547.5 517.9 543.9 515.8 540.3 516.4C538.1 516.7 535.9 516.9 533.7 516.9H451.8C447.6 516.9 444.2 520.3 444.2 524.5V612.9C444.2 617.1 447.6 620.5 451.8 620.5H533.7C546.1 620.5 558.1 619 569.6 616.1C573.8 615.1 576.3 610.7 575 606.5L548.6 521.5Z",
      color: "#FF6877",
      price: 6000,
      textX: 498,
      textY: 568,
      textRotation: 0
    },
    {
      id: "209",
      name: "209",
      path: "M568.1 496.5C564.6 502 560 506.6 554.5 510.1C551.6 511.9 550.3 515.5 551.4 518.8L579.2 603.9C580.6 608.1 585.3 610.3 589.4 608.5C623.9 593.6 651.6 565.8 666.5 531.3C668.3 527.2 666.1 522.5 661.9 521.1L576.8 493.4C573.5 492.3 569.9 493.6 568.1 496.5Z",
      color: "#F1F298",
      price: 6000,
      textX: 610,
      textY: 550,
      textRotation: 0
    },
    {
      id: "210",
      name: "210",
      path: "M664.5 516.9C668.7 518.2 673 515.7 674.1 511.5C676.9 500.2 678.4 488.4 678.4 476.2V394.8C678.4 390.6 675 387.2 670.8 387.2H582.4C578.2 387.2 574.8 390.6 574.8 394.8V476.2C574.8 478.4 574.6 480.5 574.3 482.6C574.8 486.2 576.1 489.7 579.6 490.8L664.5 516.9Z",
      color: "#D06EE9",
      price: 7000,
      textX: 626,
      textY: 440,
      textRotation: 0
    },
    {
      id: "211",
      name: "211",
      path: "M581.7 279.5H671.2C675.1 279.5 678.3 282.7 678.3 286.6V376.1C678.3 380 675.1 383.2 671.2 383.2H581.7C577.8 383.2 574.6 380 574.6 376.1V286.6C574.6 282.6 577.8 279.5 581.7 279.5Z",
      color: "#D06EE9",
      price: 7000,
      textX: 626,
      textY: 332,
      textRotation: 0
    },
    {
      id: "212",
      name: "212",
      path: "M581.7 171.7H671.2C675.1 171.7 678.3 174.9 678.3 178.8V268.3C678.3 272.2 675.1 275.4 671.2 275.4H581.7C577.8 275.4 574.6 272.2 574.6 268.3V178.8C574.6 174.9 577.8 171.7 581.7 171.7Z",
      color: "#A49EFD",
      price: 7000,
      textX: 626,
      textY: 224,
      textRotation: 0
    },
    {
      id: "213",
      name: "213",
      path: "M581.7 64H671.2C675.1 64 678.3 67.2 678.3 71.1V160.6C678.3 164.5 675.1 167.7 671.2 167.7H581.7C577.8 167.7 574.6 164.5 574.6 160.6V71.1C574.6 67.2 577.8 64 581.7 64Z",
      color: "#4ED784",
      price: 8000,
      textX: 626,
      textY: 116,
      textRotation: 0
    },
    // Общая зона
    {
      id: "GENERAL ACCESS",
      name: "GENERAL ACCESS",
      path: "M195.1 167.7H533.7C537.9 167.7 541.3 171.1 541.3 175.3V508.8C541.3 513 537.9 516.4 533.7 516.4H195.1C190.9 516.4 187.5 513 187.5 508.8V175.3C187.5 171.1 190.9 167.7 195.1 167.7Z",
      color: "#5BD6D3",
      price: 5000,
      textX: 364,
      textY: 342,
      textRotation: 0,
    },
  ]

  const getZoneOpacity = (zoneName: string) => {
    if (!selectedZone) return "1"
    return selectedZone.name === zoneName ? "1" : "0.5"
  }

  const getZoneSeats = (zoneId: string) => {
    return seats.filter(s => s.zone_id === zoneId)
  }

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.has(seat.id)) return "#8B5CF6"
    switch (seat.status) {
      case "sold":
        return "#EF4444"
      case "reserved":
        return "#F59E0B"
      default:
        return "#D1D5DB"
    }
  }

  const handleSeatClick = (seat: Seat) => {
    if (onSeatSelect) {
      onSeatSelect(seat)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetView = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const zoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.5))

  return (
    <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button size="sm" variant="outline" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={resetView}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        {selectedZone && (
          <Button size="sm" variant="outline" onClick={() => onZoneSelect(null)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* SVG Map */}
      <div 
        className="relative overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          width="729" 
          height="671" 
          viewBox="0 0 729 671" 
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <defs>
            <clipPath id="clip0_7_419">
              <rect width="728.6" height="670.8" fill="white"/>
            </clipPath>
          </defs>
          
          <g id="Arena" clipPath="url(#clip0_7_419)">
            {/* Render zones */}
            {venueZones.map((zone) => {
              const zoneData = zones.find(z => z.id === zone.id)
              const zoneSeats = getZoneSeats(zone.id)
              const isSelected = selectedZone?.id === zone.id
              const isHovered = hoveredZone === zone.name
              
              return (
            <g key={zone.id}>
                  <path
                    d={zone.path}
                fill={zone.color}
                    opacity={getZoneOpacity(zone.name)}
                    stroke={isSelected ? "#8B5CF6" : isHovered ? "#374151" : "none"}
                    strokeWidth={isSelected ? 3 : isHovered ? 2 : 0}
                    className="cursor-pointer transition-all duration-200 hover:opacity-80"
                    onClick={() => onZoneSelect(zonesMap.get(zone.name) || null)}
                    onMouseEnter={() => setHoveredZone(zone.name)}
                    onMouseLeave={() => setHoveredZone(null)}
              />
              <text
                    x={zone.textX}
                    y={zone.textY}
                    transform={zone.textRotation ? `rotate(${zone.textRotation} ${zone.textX} ${zone.textY})` : ""}
                    fill="white"
                    fontSize={zone.id === 'general' ? '24' : '16'}
                    fontWeight="bold"
                textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none"
              >
                {zone.name}
              </text>
                  
                  {/* Render seats for selected zone */}
                  {isSelected && zoneSeats.map((seat) => (
                    <circle
                      key={seat.id}
                      cx={seat.x_coordinate}
                      cy={seat.y_coordinate}
                      r="3"
                      fill={getSeatColor(seat)}
                      stroke={selectedSeats.has(seat.id) ? "#8B5CF6" : "#374151"}
                      strokeWidth={selectedSeats.has(seat.id) ? 2 : 1}
                      className="cursor-pointer hover:r-4 transition-all duration-200"
                      onClick={() => handleSeatClick(seat)}
                      data-title={`Ряд ${seat.row_number}, Место ${seat.seat_number} - ${seat.status}`}
                    />
                  ))}
                </g>
              )
            })}
            
            {/* Stage */}
            <path 
              d="M197.602 0H530.002C534.202 0 537.702 3.4 537.702 7.6V39.3C537.702 43.5 534.302 47 530.002 47H197.602C193.402 47 190.002 43.6 190.002 39.3V7.6C189.902 3.4 193.302 0 197.602 0Z" 
              fill="#BEBEBE"
            />
            <text
              x="364"
              y="23.5"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              СЦЕНА
            </text>
            
            {/* Center aisle */}
            <path 
              d="M398.4 624L330.5 624.2C326.3 624.2 323 627.6 323 631.7V662.9C323 667.1 326.4 670.5 330.6 670.4C345.2 670.3 377.6 670.2 398.5 670.2C402.7 670.2 406 666.8 406 662.7V631.6C406 627.4 402.6 624 398.4 624Z" 
              fill="#BEBEBE"
            />
          </g>
      </svg>
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Доступно</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Забронировано</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Продано</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span>Выбрано</span>
          </div>
        </div>
      </div>
    </div>
  )
}