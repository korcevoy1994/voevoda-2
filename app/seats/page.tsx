"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Zone, Seat } from "@/lib/types"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ShoppingCart, RefreshCw, Map } from "lucide-react"
import Link from "next/link"
import { SeatSelector } from "@/components/seat-selector"
import { SeatMapVisual } from "@/components/seat-map-visual"
import { ReservationTimer } from "@/components/reservation-timer"

export default function SeatsPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [allSeats, setAllSeats] = useState<Seat[]>([])
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const { items, getTotalItems, getTotalPrice, addItem, removeItem } = useCartStore()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedZone) {
      const zoneSeats = allSeats.filter((seat) => seat.zone_id === selectedZone.id)
      setSeats(zoneSeats)
    }
  }, [selectedZone, allSeats])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get event first
      const { data: events, error: eventError } = await supabase.from("events").select("id").limit(1).single()

      if (eventError) {
        console.error("Error fetching event:", eventError)
        return
      }

      // Fetch zones and all seats in parallel
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

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await fetchData()
    } finally {
      setRefreshing(false)
    }
  }

  const handleSeatSelect = (seat: Seat) => {
    if (seat.status !== "available") return

    const zone = zones.find((z) => z.id === seat.zone_id)
    if (!zone) return

    const isSelected = items.some((item) => item.seat.id === seat.id)

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
      {/* Header */}
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
              <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}>
                <Map className="h-4 w-4 mr-2" />
                {viewMode === "list" ? "Схема" : "Список"}
              </Button>
              <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing}>
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
        <div className="mb-6">
          <ReservationTimer />
        </div>

        {viewMode === "map" ? (
          <div className="space-y-6">
            <SeatMapVisual
              zones={zones}
              seats={allSeats}
              selectedZone={selectedZone}
              onZoneSelect={setSelectedZone}
              onSeatSelect={handleSeatSelect}
              selectedSeats={selectedSeatIds}
            />
            {getTotalItems() > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Выбрано мест: {getTotalItems()}</p>
                      <p className="text-lg font-bold text-purple-600">
                        Итого: {getTotalPrice().toLocaleString("ru-RU")} ₽
                      </p>
                    </div>
                    <Link href="/cart">
                      <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                        🚀 Перейти к оформлению
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Zone Selection */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Выберите зону</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {zones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Зоны не найдены. Проверьте настройку базы данных.</p>
                  ) : (
                    zones.map((zone) => (
                      <Button
                        key={zone.id}
                        variant={selectedZone?.id === zone.id ? "default" : "outline"}
                        className="w-full justify-between"
                        onClick={() => setSelectedZone(zone)}
                      >
                        <span>{zone.name}</span>
                        <span className="font-semibold">{zone.price.toLocaleString("ru-RU")} ₽</span>
                      </Button>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Обозначения</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">Свободно</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm">Забронировано</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Занято</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Выбрано</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seat Selection */}
            <div className="lg:col-span-3">
              {!selectedZone ? (
                <Card className="h-96 flex items-center justify-center">
                  <CardContent>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Выберите зону</h3>
                      <p className="text-muted-foreground">
                        Сначала выберите зону в левой панели, чтобы увидеть доступные места
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {selectedZone.name} - {selectedZone.price.toLocaleString("ru-RU")} ₽
                    </h2>
                    {getTotalItems() > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Выбрано мест: {getTotalItems()}</p>
                        <p className="font-semibold">Итого: {getTotalPrice().toLocaleString("ru-RU")} ₽</p>
                      </div>
                    )}
                  </div>
                  <SeatSelector zone={selectedZone} seats={seats} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fixed Bottom Bar */}
        {getTotalItems() > 0 && viewMode === "list" && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="container mx-auto flex items-center justify-between">
              <div>
                <p className="font-semibold">Выбрано мест: {getTotalItems()}</p>
                <p className="text-lg font-bold text-purple-600">Итого: {getTotalPrice().toLocaleString("ru-RU")} ₽</p>
              </div>
              <Link href="/cart">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  🚀 Перейти к оформлению
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
