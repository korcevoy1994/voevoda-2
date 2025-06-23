"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ShoppingCart, CreditCard, User, Mail, Phone, Loader2, XIcon } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const router = useRouter()
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [seats, setSeats] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Читаем выбранные места из localStorage
    const stored = localStorage.getItem('selectedSeats')
    if (stored) {
      try {
        const arr = JSON.parse(stored)
        if (Array.isArray(arr)) setSelectedSeatIds(arr.filter((x: any) => typeof x === 'string'))
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (selectedSeatIds.length === 0) {
      setLoading(false)
      return
    }
    // Грузим инфу о местах и зонах
    const fetchData = async () => {
      setLoading(true)
      const { data: seatsData } = await fetchSeats(selectedSeatIds)
      setSeats(Array.isArray(seatsData) ? seatsData : [])
      // Получаем уникальные zone_id
      const zoneIds: string[] = Array.from(
        new Set(
          (Array.isArray(seatsData) ? seatsData : []).map((s: any) =>
            s && typeof s.zone_id !== "undefined" ? String(s.zone_id) : ""
          )
        )
      );
      const zoneIdsFiltered = zoneIds.filter(Boolean);
      const { data: zonesData } = await fetchZones(zoneIdsFiltered);
      setZones(zonesData || []);
      setLoading(false);
    }
    fetchData()
  }, [selectedSeatIds])

  const fetchSeats = async (ids: string[]) => {
    const { data, error } = await fetch(`/api/seats?ids=${ids.join(',')}`).then(r => r.json())
    return { data, error }
  }
  const fetchZones = async (ids: string[]) => {
    const { data, error } = await fetch(`/api/zones?ids=${ids.join(',')}`).then(r => r.json())
    return { data, error }
  }

  // Собираем билеты для отображения
  const tickets = seats.map(seat => {
    const zone = zones.find(z => z.id === seat.zone_id)
    return zone ? {
      id: seat.id,
      sector: zone.name,
      row: String.fromCharCode(64 + seat.row_number),
      seat: String(seat.seat_number),
      price: zone.price,
    } : null
  }).filter((t): t is {id: string, sector: string, row: string, seat: string, price: number} => Boolean(t))

  const total = tickets.reduce((sum, t) => sum + t.price, 0)

  const handleRemove = (id: string) => {
    const newIds = selectedSeatIds.filter(sid => sid !== id)
    setSelectedSeatIds(newIds)
    localStorage.setItem('selectedSeats', JSON.stringify(newIds))
  }

  const handleOrder = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          items: tickets.map(t => ({ seat_id: t.id, price: t.price })),
        }),
      })
      const data = await res.json()
      if (res.ok && data.orderId) {
        setSelectedSeatIds([])
        localStorage.removeItem('selectedSeats')
        setName("")
        setEmail("")
        setPhone("")
        router.push(`/order-success?orderId=${data.orderId}`)
      } else {
        setError(data.error || 'Ошибка оформления заказа')
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка оформления заказа')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = name.length > 1 && email.includes('@') && tickets.length > 0

  if (!loading && selectedSeatIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gray-50">
        <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Нет выбранных мест</h2>
        <p className="text-gray-500 mb-6">Сначала выберите места на схеме.</p>
        <Link href="/seats">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />К выбору мест
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
       <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/seats">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к выбору мест
              </Button>
            </Link>
          <h1 className="text-xl font-semibold">🛒 Оформление заказа</h1>
           <div className="w-24"></div> {/* Spacer */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
         <form onSubmit={e => { e.preventDefault(); if (isFormValid) handleOrder(); }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Форма для данных пользователя */}
            <div className="lg:col-span-2">
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Контактная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                     <Label htmlFor="name" className="flex items-center gap-2 mb-1"><User className="h-4 w-4" />Ваше имя</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Иван Петров" required minLength={2} />
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-1"><Mail className="h-4 w-4" />Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" required />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-1"><Phone className="h-4 w-4" />Номер телефона</Label>
                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+373 60000000" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Сайдбар с заказом */}
            <div className="lg:col-span-1 sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Ваш заказ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                      {tickets.map(ticket => (
                        <div key={ticket.id} className="flex items-start justify-between text-sm bg-gray-100 rounded-lg px-3 py-2">
                          <div>
                            <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full uppercase tracking-widest mr-2">{ticket.sector}</span>
                            Ряд {ticket.row}, М. {ticket.seat}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold whitespace-nowrap">{ticket.price.toLocaleString("ru-RU")} лей</span>
                            <button onClick={() => handleRemove(ticket.id)} className="p-1 rounded-full hover:bg-yellow-400 transition group">
                              <XIcon className="h-4 w-4 text-yellow-400 group-hover:text-black" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-4">
                       <div className="flex items-center justify-between font-bold text-lg">
                          <p>Итого:</p>
                          <p className="text-purple-600">
                            {total.toLocaleString("ru-RU")} лей
                          </p>
                       </div>
                        <Button type="submit" size="lg" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg py-3 rounded-xl transition disabled:opacity-60" disabled={!isFormValid || isSubmitting}>
                           {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           ) : (
                            <CreditCard className="mr-2 h-4 w-4" />
                           )}
                          Оформить заказ
                        </Button>
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    </div>
                </CardContent>
              </Card>
            </div>
          </form>
      </main>
    </div>
  )
}
