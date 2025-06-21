"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ShoppingCart, CreditCard, User, Mail, Phone, Loader2 } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"


const formSchema = z.object({
  name: z.string().min(2, { message: "Имя должно содержать не менее 2 символов." }),
  email: z.string().email({ message: "Введите корректный email." }),
  phone: z.string().min(5, { message: "Введите корректный номер телефона." }),
})

type FormData = z.infer<typeof formSchema>

export default function CartPage() {
  const router = useRouter()
  const { items, getTotalItems, getTotalPrice, removeItem, clearCart } = useCartStore()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  })
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  if (items.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gray-50">
        <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Ваша корзина пуста</h2>
        <p className="text-gray-500 mb-6">Самое время выбрать лучшие места!</p>
        <Link href="/seats">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />К выбору мест
          </Button>
        </Link>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const promise = () => new Promise(async (resolve, reject) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          items: items.map(item => ({
            seat_id: item.seat.id,
            price: item.price,
          })),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        resolve(result);
      } else {
        reject(result);
      }
    });

    toast.promise(promise(), {
      loading: 'Создаем ваш заказ...',
      success: (data: any) => {
        clearCart();
        router.push(`/order-success?orderId=${data.orderId}`);
        return `Заказ #${data.orderId} успешно создан!`;
      },
      error: (err) => {
        setIsLoading(false);
        return `Ошибка: ${err.error || 'Не удалось создать заказ.'}`;
      },
    });
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
         <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Форма для данных пользователя */}
            <div className="lg:col-span-2">
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Контактная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                     <Label htmlFor="name" className="flex items-center gap-2 mb-1"><User className="h-4 w-4" />Ваше имя</Label>
                    <Input id="name" {...register("name")} placeholder="Иван Петров" />
                     {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-1"><Mail className="h-4 w-4" />Email</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="example@mail.com" />
                     {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-1"><Phone className="h-4 w-4" />Номер телефона</Label>
                    <Input id="phone" {...register("phone")} placeholder="+7 (999) 123-45-67" />
                     {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
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
                      {items.map(item => (
                        <div key={item.seat.id} className="flex items-start justify-between text-sm">
                          <div>
                            <p>Зона {item.zone.name}, Ряд {String.fromCharCode(64 + item.seat.row_number)}, М. {item.seat.seat_number}</p>
                          </div>
                          <p className="font-semibold whitespace-nowrap">{item.price.toLocaleString("ru-RU")} ₽</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-4">
                       <div className="flex items-center justify-between font-bold text-lg">
                          <p>Итого:</p>
                          <p className="text-purple-600">
                            {getTotalPrice().toLocaleString("ru-RU")} ₽
                          </p>
                       </div>
                        <Button type="submit" size="lg" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                           {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           ) : (
                            <CreditCard className="mr-2 h-4 w-4" />
                           )}
                          Оплатить и получить билеты
                        </Button>
                    </div>
                </CardContent>
              </Card>
            </div>
          </form>
      </main>
    </div>
  )
}
