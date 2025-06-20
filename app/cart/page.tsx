"use client"

import type React from "react"

import { useState } from "react"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Trash2, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ReservationTimer } from "@/components/reservation-timer"

export default function CartPage() {
  const { items, removeItem, clearCart, getTotalPrice, getTotalItems } = useCartStore()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: formData.name,
          user_email: formData.email,
          user_phone: formData.phone,
          items: items.map((item) => ({
            seat_id: item.seat.id,
            price: item.price,
          })),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        clearCart()
        router.push(`/order-success?orderId=${result.orderId}`)
      } else {
        throw new Error("Ошибка при создании заказа")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Произошла ошибка при оформлении заказа. Попробуйте еще раз.")
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/seats">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад к выбору мест
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Корзина</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Корзина пуста</h2>
              <p className="text-muted-foreground mb-4">Выберите места для покупки билетов</p>
              <Link href="/seats">
                <Button>Выбрать места</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/seats">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к выбору мест
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Корзина ({getTotalItems()})</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <ReservationTimer />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Cart Items */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Выбранные места</span>
                  <Button variant="outline" size="sm" onClick={clearCart} className="text-red-600 hover:text-red-700">
                    Очистить корзину
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.seat.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{item.zone.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ряд {item.seat.row_number}, Место {item.seat.seat_number}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{item.price.toLocaleString("ru-RU")} ₽</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.seat.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Итого:</span>
                    <span>{getTotalPrice().toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Данные для заказа</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Имя *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Введите ваше имя"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                      {loading ? "Оформление..." : `Оформить заказ на ${getTotalPrice().toLocaleString("ru-RU")} ₽`}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Нажимая "Оформить заказ", вы соглашаетесь с{" "}
                    <Link href="/terms" className="underline">
                      условиями использования
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
