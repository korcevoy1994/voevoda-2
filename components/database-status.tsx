"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Database } from "lucide-react"

interface DatabaseStats {
  events: number
  zones: number
  seats: number
  availableSeats: number
  soldSeats: number
  reservedSeats: number
}

export function DatabaseStatus() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all stats in parallel
      const [eventsResult, zonesResult, seatsResult] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("zones").select("id", { count: "exact", head: true }),
        supabase.from("seats").select("status", { count: "exact" }),
      ])

      if (eventsResult.error) throw eventsResult.error
      if (zonesResult.error) throw zonesResult.error
      if (seatsResult.error) throw seatsResult.error

      const seatsByStatus = seatsResult.data?.reduce(
        (acc, seat) => {
          acc[seat.status] = (acc[seat.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      setStats({
        events: eventsResult.count || 0,
        zones: zonesResult.count || 0,
        seats: seatsResult.count || 0,
        availableSeats: seatsByStatus?.available || 0,
        soldSeats: seatsByStatus?.sold || 0,
        reservedSeats: seatsByStatus?.reserved || 0,
      })
    } catch (err) {
      console.error("Error fetching database stats:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 animate-pulse text-blue-600" />
            <span className="text-sm text-blue-700">Проверка подключения к базе данных...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">Ошибка подключения к БД: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.events === 0) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              База данных пуста. Выполните SQL скрипты для создания тестовых данных.
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-green-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">База данных подключена</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.events} событий
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.zones} зон
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.seats} мест
            </Badge>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-green-600">
          <span>Свободно: {stats.availableSeats}</span>
          <span>Продано: {stats.soldSeats}</span>
          {stats.reservedSeats > 0 && <span>Забронировано: {stats.reservedSeats}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
