"use client"
import { useState } from "react"

export function MaibPayButton({ amount, description }: { amount: number, description?: string }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/maib", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        description,
        clientIp: "127.0.0.1"
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
    } else {
      alert("Ошибка оплаты: " + (data.error || "Unknown error"));
    }
  };

  return (
    <button
      className="w-full py-3 px-6 bg-green-600 text-white rounded-xl text-lg font-bold hover:bg-green-700 transition"
      onClick={handlePay}
      disabled={loading}
    >
      {loading ? "Перенаправление..." : "Оплатить через MAIB"}
    </button>
  );
} 