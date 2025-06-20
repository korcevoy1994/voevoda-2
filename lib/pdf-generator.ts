interface PDFData {
  orderId: string
  userName: string
  userEmail: string
  items: Array<{
    seat_id: string
    price: number
    zoneName?: string
    rowNumber?: number
    seatNumber?: number
  }>
  totalAmount: number
}

export async function generatePDF(data: PDFData): Promise<Buffer> {
  // Enhanced PDF content with better formatting
  const eventDate = new Date("2024-07-15T19:00:00").toLocaleString("ru-RU")

  let ticketsContent = ""
  data.items.forEach((item, index) => {
    ticketsContent += `
    
    ═══════════════════════════════════════════════════════════════
                            🎫 БИЛЕТ №${index + 1}
    ═══════════════════════════════════════════════════════════════
    
    КОНЦЕРТ "ЗВЕЗДЫ ЭСТРАДЫ"
    
    Дата и время: ${eventDate}
    Место проведения: Дворец Спорта "Арена"
    
    ───────────────────────────────────────────────────────────────
    МЕСТО:
    Зона: ${item.zoneName || "N/A"}
    Ряд: ${item.rowNumber || "N/A"}
    Место: ${item.seatNumber || "N/A"}
    Цена: ${item.price.toLocaleString("ru-RU")} ₽
    ───────────────────────────────────────────────────────────────
    
    Покупатель: ${data.userName}
    Email: ${data.userEmail}
    Заказ: ${data.orderId}
    
    [QR-КОД: ${data.orderId}-${item.seat_id}]
    
    ⚠️  ВАЖНО:
    • Приходите за 30 минут до начала
    • Билет действителен только с документом
    • Сохраните билет до окончания мероприятия
    
    ═══════════════════════════════════════════════════════════════
    `
  })

  const pdfContent = `
    TicketBooking - Электронные билеты
    
    Заказ создан: ${new Date().toLocaleString("ru-RU")}
    Общая сумма: ${data.totalAmount.toLocaleString("ru-RU")} ₽
    Количество билетов: ${data.items.length}
    
    ${ticketsContent}
    
    ───────────────────────────────────────────────────────────────
    Техническая поддержка: support@ticketbooking.ru
    Сайт: https://ticketbooking.ru
    ───────────────────────────────────────────────────────────────
  `

  // Convert to buffer
  return Buffer.from(pdfContent, "utf-8")
}

// Function to generate QR code data
export function generateQRData(orderId: string, seatId: string): string {
  return JSON.stringify({
    orderId,
    seatId,
    timestamp: Date.now(),
    venue: 'Дворец Спорта "Арена"',
    event: 'Концерт "Звезды Эстрады"',
  })
}
