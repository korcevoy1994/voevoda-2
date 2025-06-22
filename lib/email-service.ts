import nodemailer from "nodemailer"

interface EmailData {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: `"Povestea de Iarnă" <${process.env.SMTP_USER}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
      attachments: data.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    })

    console.log("Email sent successfully to:", data.to)
    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

export function generateTicketEmail(orderData: {
  userName: string
  orderId: string
  items: Array<{
    zoneName: string
    rowNumber: number
    seatNumber: number
    price: number
  }>
  totalAmount: number
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ваши билеты</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket { background: white; border: 2px dashed #667eea; margin: 15px 0; padding: 20px; border-radius: 8px; }
        .total { background: #667eea; color: white; padding: 15px; text-align: center; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 Ваши билеты готовы!</h1>
          <p>Спасибо за покупку, ${orderData.userName}!</p>
        </div>
        
        <div class="content">
          <h2>Детали заказа #${orderData.orderId}</h2>
          
          ${orderData.items
            .map(
              (item) => `
            <div class="ticket">
              <h3>🎭 Концерт "Звезды Эстрады"</h3>
              <p><strong>Зона:</strong> ${item.zoneName}</p>
              <p><strong>Ряд:</strong> ${item.rowNumber} | <strong>Место:</strong> ${item.seatNumber}</p>
              <p><strong>Цена:</strong> ${item.price.toLocaleString("ru-RU")} ₽</p>
              <p><strong>Дата:</strong> 15 июля 2024, 19:00</p>
              <p><strong>Место проведения:</strong> Дворец Спорта "Арена"</p>
            </div>
          `,
            )
            .join("")}
          
          <div class="total">
            <h3>Общая сумма: ${orderData.totalAmount.toLocaleString("ru-RU")} ₽</h3>
          </div>
          
          <p><strong>Важная информация:</strong></p>
          <ul>
            <li>Билеты во вложении в формате PDF</li>
            <li>Приходите за 30 минут до начала</li>
            <li>При входе предъявите билет и документ, удостоверяющий личность</li>
            <li>Сохраните этот email до посещения мероприятия</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>С вопросами обращайтесь: support@ticketbooking.ru</p>
          <p>© 2024 TicketBooking. Все права защищены.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
