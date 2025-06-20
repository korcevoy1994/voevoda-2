import { db } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { DatabaseStatus } from "@/components/database-status"

export default async function HomePage() {
  const event = await db.getEvent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🎫 TicketBooking</h1>
            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="outline">Корзина</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Database Status */}
        <div className="mb-8">
          <DatabaseStatus />
        </div>

        {!event ? (
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold mb-4">Настройка базы данных</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Для начала работы выполните SQL скрипты для создания тестовых данных:
            </p>
            <div className="max-w-md mx-auto space-y-2 text-left bg-gray-100 p-4 rounded-lg font-mono text-sm">
              <div>1. scripts/01-create-tables.sql</div>
              <div>2. scripts/02-seed-data-fixed.sql</div>
              <div>3. scripts/03-add-cleanup-function.sql</div>
              <div>4. scripts/04-verify-data.sql (проверка)</div>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Event Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
                  <p className="text-lg text-gray-600 leading-relaxed">{event.description}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">
                      {new Date(event.event_date).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">
                      {new Date(event.event_date).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">{event.venue}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link href="/seats">
                    <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg">
                      🎯 Купить билет
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Event Poster */}
              <div className="relative">
                <Card className="overflow-hidden shadow-2xl">
                  <CardContent className="p-0">
                    <Image
                      src={event.poster_url || "/placeholder.svg?height=400&width=600"}
                      alt={event.title}
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Features Section */}
            <section className="mt-16">
              <h2 className="text-3xl font-bold text-center mb-12">✨ Почему выбирают нас?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">🎯 Удобный выбор мест</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Интерактивная схема зала позволяет выбрать лучшие места с учетом ваших предпочтений
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">⚡ Мгновенное бронирование</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Места бронируются на 10 минут, что дает вам время на оформление заказа
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">📧 Электронные билеты</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Получите билеты в PDF формате на email сразу после оплаты</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
