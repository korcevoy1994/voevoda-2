import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { generatePDF } from "@/lib/pdf-generator"
import { generateTicketEmail, sendEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_name, user_email, user_phone, items } = body

    if (!user_name || !user_email || !items || items.length === 0) {
      return NextResponse.json({ error: "Недостаточно данных для создания заказа" }, { status: 400 })
    }

    // Validate that all seats are still available/reserved
    const seatIds = items.map((item: any) => item.seat_id)

    // Calculate total amount
    const total_amount = items.reduce((sum: number, item: any) => sum + item.price, 0)

    // Create order using database service
    const { order, success } = await db.createOrder({
      user_name,
      user_email,
      user_phone,
      total_amount,
      items,
    })

    if (!success || !order) {
      return NextResponse.json({ error: "Ошибка при создании заказа" }, { status: 500 })
    }

    // Get detailed order information for email and PDF
    const orderDetails = await db.getOrderWithDetails(order.id)

    if (orderDetails) {
      try {
        // Prepare seat details for email and PDF
        const seatDetails = orderDetails.order_items.map((item: any) => ({
          zoneName: item.seats.zones.name,
          rowNumber: item.seats.row_number,
          seatNumber: item.seats.seat_number,
          price: item.price,
        }))

        // Generate PDF ticket
        const pdfBuffer = await generatePDF({
          orderId: order.id,
          userName: user_name,
          userEmail: user_email,
          items: items.map((item: any, index: number) => ({
            ...item,
            zoneName: seatDetails[index]?.zoneName,
            rowNumber: seatDetails[index]?.rowNumber,
            seatNumber: seatDetails[index]?.seatNumber,
          })),
          totalAmount: total_amount,
        })

        // Generate and send email
        const emailHtml = generateTicketEmail({
          userName: user_name,
          orderId: order.id,
          items: seatDetails,
          totalAmount: total_amount,
        })

        const emailSent = await sendEmail({
          to: user_email,
          subject: `🎫 Ваши билеты - Заказ #${order.id}`,
          html: emailHtml,
          attachments: [
            {
              filename: `tickets-${order.id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        })

        if (emailSent) {
          console.log("✅ Email sent successfully for order:", order.id)
        } else {
          console.error("❌ Failed to send email for order:", order.id)
        }
      } catch (emailError) {
        console.error("Error with email/PDF generation:", emailError)
        // Don't fail the order if email fails
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Заказ успешно создан! Билеты отправлены на ваш email.",
    })
  } catch (error) {
    console.error("Error processing order:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
