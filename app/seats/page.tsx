"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Zone, Seat, Event, Performer, PriceRange } from "@/lib/types"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ShoppingCart, RefreshCw, XIcon } from "lucide-react"
import Link from "next/link"
import { VenueMap } from "@/components/venue-map"
import { ReservationTimer } from "@/components/reservation-timer"
import { SeatLayout } from "@/components/seat-layout"
import EventDetails from "@/components/event-details"

export default function SeatsPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [allSeats, setAllSeats] = useState<Seat[]>([])
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { items, getTotalItems, getTotalPrice, addItem, removeItem } = useCartStore()
  const [isClient, setIsClient] = useState(false)

  // Новое: данные о событии
  const [event, setEvent] = useState<Event | null>(null)
  const [performers, setPerformers] = useState<Performer[]>([])
  const [priceRange, setPriceRange] = useState<PriceRange>({ min_price: 0, max_price: 0 })

  useEffect(() => {
    setIsClient(true)
    fetchData()
    fetchEventInfo()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setRefreshing(true)
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
      setRefreshing(false)
    }
  }

  // Новое: загрузка инфы о событии
  const fetchEventInfo = async () => {
    const { data: event, error: eventError } = await supabase.from('events').select('*').limit(1).single()
    if (eventError) return
    setEvent(event)
    const { data: performers } = await supabase.from('performers').select('*').eq('event_id', event.id)
    setPerformers(performers || [])
    const { data: zones } = await supabase.from('zones').select('price').eq('event_id', event.id)
    const prices = (zones?.map(z => z.price).filter(p => p !== null) as number[]) || []
    setPriceRange({
      min_price: prices.length > 0 ? Math.min(...prices) : 0,
      max_price: prices.length > 0 ? Math.max(...prices) : 0,
    })
  }

  const handleZoneClick = (zone: Zone | null) => {
    if (zone && zone.name.startsWith('2')) {
      setSelectedZone(zone)
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
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      {/* Информация о мероприятии */}
      <div className="max-w-4xl mx-auto mt-8 mb-8">
        {event && (
          <EventDetails event={event} performers={performers} priceRange={priceRange} />
        )}
      </div>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <ReservationTimer />
            </div>
            {!selectedZone ? (
              <VenueMap
                zones={zones}
                seats={allSeats}
                selectedZone={null}
                onZoneSelect={handleZoneClick}
                selectedSeats={selectedSeatIds}
              />
            ) : (
              <div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedZone(null)}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад к выбору зон
                </Button>
                <SeatLayout
                  zone={selectedZone}
                  seats={allSeats.filter(s => String(s.zone_id) === String(selectedZone.id))}
                  onSeatSelect={seat => handleSeatSelect(seat, selectedZone)}
                  selectedSeats={selectedSeatIds}
                />
              </div>
            )}
          </div>
          <div className="lg:col-span-1 sticky top-28">
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
                    <p>Выберите места на схеме.</p>
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
                            <p className="font-semibold text-sm">{item.price.toLocaleString("ru-RU")} MDL</p>
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
                       <div className="flex items-center justify-between text-lg font-bold">
                          <p>Итого:</p>
                          <p>{getTotalPrice().toLocaleString("ru-RU")} MDL</p>
                       </div>
                       <Link href="/cart" className="w-full">
                         <Button size="lg" className="w-full">
                           Оформить заказ
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