"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Order, OrderItemWithSeatDetails } from "@/lib/types"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Home, Download, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Function to fetch order details with retries
async function fetchOrderWithRetries(orderId: string) {
    const maxRetries = 3;
    const delay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const { data, error } = await supabase
              .rpc("get_order_details", { p_order_id: orderId });
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              return data; // Success, return data
            }

            // If data is empty, retry
            if (attempt < maxRetries) {
              await new Promise(res => setTimeout(res, delay));
            }

        } catch (error) {
            console.error(`Attempt ${attempt} to fetch order failed:`, error);
            if (attempt >= maxRetries) {
                throw new Error("Failed to fetch order details after multiple attempts.");
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
    return null; // Return null if order is not found after retries
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItemWithSeatDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Basic UUID validation
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(orderId || '');

    if (orderId && isUUID) {
      const loadOrderData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchOrderWithRetries(orderId);

            if(data) {
                const firstItem = data[0];
                setOrder({
                    id: firstItem.order_id,
                    user_name: firstItem.user_name,
                    user_email: firstItem.user_email,
                    total_amount: firstItem.total_amount,
                    created_at: firstItem.order_created_at,
                    status: "completed",
                });

                const formattedItems: OrderItemWithSeatDetails[] = data.map((item: any) => ({
                    id: item.item_id,
                    price: item.item_price,
                    seat: {
                        id: item.seat_id,
                        row_number: item.row_number,
                        seat_number: item.seat_number,
                        zone: {
                            id: item.zone_id,
                            name: item.zone_name,
                            color: item.zone_color,
                        }
                    }
                }));
                setItems(formattedItems);
            } else {
                 setError("Не удалось найти информацию о вашем заказе.");
            }
        } catch (err) {
            console.error(err);
            setError("Произошла ошибка при загрузке заказа.");
        } finally {
            setLoading(false);
        }
      };

      loadOrderData();
    } else {
        setError("Неверный или отсутствующий ID заказа.");
        setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="ml-4 text-lg">Загружаем детали вашего заказа...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-semibold mb-4">{error ? "Ошибка" : "Заказ не найден"}</h2>
          <p className="text-gray-500 mb-6">{error || "Не удалось найти информацию о вашем заказе."}</p>
          <Link href="/">
            <Button variant="outline"><Home className="h-4 w-4 mr-2" />На главную</Button>
          </Link>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Спасибо за покупку!</h1>
            <p className="text-gray-600 mt-2">Ваш заказ <span className="font-semibold text-purple-600">#{order.id.substring(0, 8)}</span> успешно оформлен.</p>
            <p className="text-sm text-gray-500">Билеты были отправлены на ваш email: {order.user_email}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Детали заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map(item => (
                 <div key={item.id} className="flex justify-between items-center text-sm">
                   <p>Зона {item.seat.zone.name}, Ряд {item.seat.row_number}, Место {item.seat.seat_number}</p>
                   <p className="font-semibold">{Number(item.price).toLocaleString('ru-RU')} ₽</p>
                 </div>
              ))}
              <div className="border-t my-3" />
              <div className="flex justify-between items-center font-bold text-lg">
                <p>Итого</p>
                <p className="text-purple-600">{Number(order.total_amount).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>

         <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="w-full sm:w-auto" disabled>
                <Download className="h-4 w-4 mr-2" />
                Скачать PDF (скоро)
            </Button>
             <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    На главную
                </Button>
            </Link>
        </div>
      </div>
    </div>
  )
}
