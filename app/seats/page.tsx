"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Zone, Seat } from "@/lib/types"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ShoppingCart, RefreshCw, Map, XIcon } from "lucide-react"
import Link from "next/link"
import { VenueMap } from "@/components/venue-map"
import { ReservationTimer } from "@/components/reservation-timer"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SeatLayout } from "@/components/seat-layout"

export default function SeatsPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [allSeats, setAllSeats] = useState<Seat[]>([])
  const [selectedZoneForLayout, setSelectedZoneForLayout] = useState<Zone | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { items, getTotalItems, getTotalPrice, addItem, removeItem } = useCartStore()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: events, error: eventError } = await supabase.from("events").select("id").limit(1).single()
      if (eventError) {
        console.error("Error fetching event:", eventError)
        return
      }
      const [zonesResult, seatsResult] = await Promise.all([
        supabase.from("zones").select("*").eq("event_id", events.id).order("price", { ascending: false }),
        supabase.from("seats").select("*").order("row_number").order("seat_number"),
      ])
      if (zonesResult.error) throw zonesResult.error
      if (seatsResult.error) throw seatsResult.error
      setZones(zonesResult.data || [])
      setAllSeats(seatsResult.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleZoneClick = (zone: Zone | null) => {
    if (zone && zone.name.startsWith('2')) { // Проверяем имя зоны, а не ID
      setSelectedZoneForLayout(zone)
    } else {
      // Для VIP и других зон можно оставить старую логику или тоже сделать модалку
      console.log("Selected a non-2xx zone:", zone?.name)
    }
  }

  const handleSeatSelect = (seat: Seat, zone: Zone) => {
    if (seat.status !== "available") return

    const isSelected = items.some((item) => item.seat.id === seat.id)
    if (isSelected) {
      removeItem(seat.id)
    } else {
      addItem({ seat, zone, price: zone.price })
    }
  }

  const selectedSeatIds = new Set(items.map((item) => item.seat.id))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Загрузка схемы зала...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">🎯 Выбор мест</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Обновить
              </Button>
              <Link href="/cart">
                <Button variant="outline" className="relative">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Корзина
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {getTotalItems()}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Основной контент (карта или схема мест) */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <ReservationTimer />
            </div>

            {!selectedZoneForLayout ? (
              <VenueMap
                zones={zones}
                seats={allSeats}
                selectedZone={selectedZoneForLayout}
                onZoneSelect={handleZoneClick}
                selectedSeats={selectedSeatIds}
              />
            ) : (
              <div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedZoneForLayout(null)}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад к выбору зон
                </Button>
                <SeatLayout
                  zone={selectedZoneForLayout}
                  seats={allSeats.filter(s => s.zone_id === selectedZoneForLayout.id)}
                  onSeatSelect={handleSeatSelect}
                  selectedSeats={selectedSeatIds}
                />
              </div>
            )}
          </div>

          {/* Сайдбар с корзиной */}
          <div className="lg:col-span-1 sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Ваш выбор
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getTotalItems() === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Выберите места на схеме,</p>
                    <p>и они появятся здесь.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                      {items.map(item => (
                        <div key={item.seat.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div>
                            <p className="font-semibold">Зона {item.zone.name}</p>
                            <p className="text-sm text-gray-600">
                              Ряд {String.fromCharCode(64 + item.seat.row_number)}, Место {item.seat.seat_number}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-sm">{item.price.toLocaleString("ru-RU")} ₽</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-red-500"
                              onClick={() => removeItem(item.seat.id)}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-4">
                       <div className="flex items-center justify-between">
                          <p className="font-semibold">Выбрано мест:</p>
                          <p className="text-lg font-bold">{getTotalItems()}</p>
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="font-semibold">Итого:</p>
                          <p className="text-lg font-bold text-purple-600">
                            {getTotalPrice().toLocaleString("ru-RU")} ₽
                          </p>
                       </div>
                       <Link href="/cart" className="w-full">
                          <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                            🚀 Перейти к оформлению
                          </Button>
                        </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
