"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Download } from "lucide-react"
import Link from "next/link"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">Заказ успешно оформлен!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Номер заказа:</p>
            <p className="font-mono font-semibold">{orderId}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Mail className="h-4 w-4" />
              <span className="text-sm">Билеты отправлены на ваш email</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-purple-600">
              <Download className="h-4 w-4" />
              <span className="text-sm">PDF билеты готовы к скачиванию</span>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Link href="/" className="block">
              <Button className="w-full">
                Вернуться на главную
                {countdown > 0 && <span className="ml-2">({countdown})</span>}
              </Button>
            </Link>
            <Link href="/seats" className="block">
              <Button variant="outline" className="w-full">
                Купить еще билеты
              </Button>
            </Link>
          </div>

          <div className="text-xs text-muted-foreground pt-4">
            <p>
              Если у вас возникли вопросы, свяжитесь с нами по email:{" "}
              <a href="mailto:support@ticketbooking.ru" className="underline">
                support@ticketbooking.ru
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
