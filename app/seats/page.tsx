"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Zone, Seat } from "@/lib/types"
import { VenueMap } from "@/components/venue-map"
import { SeatLayout } from "@/components/seat-layout"
import { ArrowLeft, XIcon } from "lucide-react"

export default function SeatsPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [allSeats, setAllSeats] = useState<Seat[]>([])
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: events } = await supabase.from("events").select("id").limit(1).single()
    if (!events) {
      setLoading(false)
      return
    }
    const [zonesResult, seatsResult] = await Promise.all([
      supabase.from("zones").select("*").eq("event_id", events.id).order("price", { ascending: false }),
      supabase.from("seats").select("*").order("row_number").order("seat_number"),
    ])
    setZones(zonesResult.data || [])
    setAllSeats(seatsResult.data || [])
    setLoading(false)
  }

  // Корзина: билеты с инфой
  const tickets = Array.from(selectedSeats).map(seatId => {
    const seat = allSeats.find(s => s.id === seatId)
    if (!seat) return null
    const zone = zones.find(z => z.id === seat.zone_id)
    return seat && zone ? {
      id: seat.id,
      sector: zone.name,
      row: String.fromCharCode(64 + seat.row_number),
      seat: String(seat.seat_number),
      price: zone.price,
    } : null
  }).filter((t): t is {id: string, sector: string, row: string, seat: string, price: number} => Boolean(t))

  const total = tickets.reduce((sum, t) => sum + (t?.price || 0), 0)

  const handleSeatSelect = (seat: Seat) => {
    if (seat.status !== "available") return
    setSelectedSeats(prev => {
      const newSet = new Set(prev)
      if (newSet.has(seat.id)) {
        newSet.delete(seat.id)
      } else {
        newSet.add(seat.id)
      }
      return newSet
    })
  }

  const handleRemove = (id: string) => {
    setSelectedSeats(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const handleContinue = () => {
    // Можно передавать через localStorage или query, здесь localStorage для простоты
    localStorage.setItem('selectedSeats', JSON.stringify(Array.from(selectedSeats)))
    router.push('/cart')
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-[#f7f7ff] flex flex-col items-center px-2 py-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-black mb-2 tracking-tight text-center">Выберите места</h1>
      <p className="text-lg text-gray-500 mb-8 text-center max-w-xl">Сначала выберите зону, затем места. После выбора нажмите "Продолжить".</p>
      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-10 items-start">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full bg-white rounded-3xl shadow-2xl p-6 md:p-10 flex flex-col items-center">
            {!selectedZone ? (
              <VenueMap
                zones={zones}
                seats={allSeats}
                selectedZone={null}
                onZoneSelect={setSelectedZone}
                selectedSeats={selectedSeats}
              />
            ) : (
              <div className="w-full flex flex-col items-center">
                <button
                  onClick={() => setSelectedZone(null)}
                  className="mb-6 flex items-center gap-2 px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-base shadow transition"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Назад к выбору зон
                </button>
                <SeatLayout
                  zone={selectedZone}
                  seats={allSeats.filter(s => String(s.zone_id) === String(selectedZone.id))}
                  onSeatSelect={handleSeatSelect}
                  selectedSeats={selectedSeats}
                />
              </div>
            )}
          </div>
        </div>
        <div className="w-full md:w-[360px] flex-shrink-0 mt-8 md:mt-0">
          <aside className="bg-black rounded-2xl shadow-xl p-8 flex flex-col w-full max-w-xs min-w-[270px] mx-auto md:mx-0">
            <div className="text-white text-2xl font-bold mb-6 tracking-wide">Ваш выбор</div>
            <div className="flex-1 flex flex-col gap-4 mb-6">
              {tickets.length === 0 ? (
                <div className="text-gray-400 text-center py-12">Нет выбранных мест</div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket.id} className="bg-gray-900 rounded-xl p-4 flex flex-col gap-2 relative">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">{ticket.sector}</span>
                      <button onClick={() => handleRemove(ticket.id)} className="ml-auto p-1 rounded-full hover:bg-yellow-400 transition group">
                        <XIcon className="h-5 w-5 text-yellow-400 group-hover:text-black" />
                      </button>
                    </div>
                    <div className="flex flex-row gap-4 items-end mt-1">
                      <span className="text-white font-semibold text-sm">Ряд {ticket.row}</span>
                      <span className="text-white font-semibold text-sm">Место {ticket.seat}</span>
                      <span className="ml-auto text-yellow-400 font-bold text-lg">{ticket.price} лей</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg py-3 rounded-xl transition disabled:opacity-60"
              disabled={tickets.length === 0}
              onClick={handleContinue}
            >
              Продолжить
            </button>
            <div className="text-white text-lg font-bold text-center mt-2">
              {total > 0 ? `Сумма: ${total} лей` : ""}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}