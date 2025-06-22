import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generateTicketPdf } from "@/lib/pdf-generator"
import { generateTicketEmail, sendEmail } from "@/lib/email-service"
import type { Order, OrderItemWithSeatDetails } from '@/lib/types';

// Схема валидации для входящих данных
const orderSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  items: z.array(z.object({
    seat_id: z.string().uuid(),
    price: z.number().positive(),
  })).min(1),
});

export async function POST(request: Request) {
  // Создаем клиент с правами администратора для выполнения серверных операций
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();

    // 1. Валидация данных
    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Неверные данные заказа', details: validation.error.errors }, { status: 400 });
    }
    const { name, email, phone, items } = validation.data;
    
    // 2. Проверка статуса мест и подсчет суммы на сервере
    const seatIds = items.map(item => item.seat_id);
    const { data: seatsData, error: seatsError } = await supabase
      .from('seats')
      .select('id, status, zones(price)')
      .in('id', seatIds);

    if (seatsError) {
      throw new Error(`Ошибка проверки мест: ${seatsError.message}`);
    }

    if (!seatsData || seatsData.length !== seatIds.length) {
       return NextResponse.json({ error: 'Некоторые из выбранных мест не найдены.' }, { status: 404 });
    }

    let totalAmount = 0;
    const priceMap = new Map<string, number>();

    for (const seat of seatsData as any[]) {
      if (seat.status !== 'available') {
        return NextResponse.json({ error: `Место ${seat.id} уже занято. Пожалуйста, выберите другие места.` }, { status: 409 });
      }
      if (!seat.zones || typeof seat.zones.price !== 'number') {
        return NextResponse.json({ error: `Не удалось получить цену для места ${seat.id}.` }, { status: 500 });
      }
      priceMap.set(seat.id, seat.zones.price);
      totalAmount += seat.zones.price;
    }

    // 3. Создание заказа и обновление мест в транзакции
    // NOTE: Supabase не поддерживает классические транзакции через API.
    // Выполняем операции последовательно и обрабатываем ошибки.
    
    // Создаем заказ
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_name: name,
        user_email: email,
        user_phone: phone,
        total_amount: totalAmount,
        status: 'completed', // Сразу считаем оплаченным для простоты
      })
      .select('id')
      .single();

    if (orderError) {
      throw new Error(`Ошибка создания заказа: ${orderError.message}`);
    }

    const orderId = orderData.id;

    // Создаем элементы заказа
    const orderItems = items.map(item => ({
      order_id: orderId,
      seat_id: item.seat_id,
      price: priceMap.get(item.seat_id)!,
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      // Здесь нужна логика отката, например, удаление созданного заказа
      console.error('Ошибка создания элементов заказа, нужно откатить заказ:', orderId);
      throw new Error(`Ошибка создания элементов заказа: ${orderItemsError.message}`);
    }

    // Обновляем статус мест
    const { error: updateSeatsError } = await supabase
      .from('seats')
      .update({ status: 'sold' })
      .in('id', seatIds);

    if (updateSeatsError) {
        // Здесь тоже нужна логика отката
       console.error('КРИТИЧЕСКАЯ ОШИБКА: Заказ создан, но места не обновлены! Order ID:', orderId);
       throw new Error(`Ошибка обновления статуса мест: ${updateSeatsError.message}`);
    }

    // 5. Генерация PDF и отправка email (НОВЫЙ БЛОК)
    try {
      // Получаем полные данные о заказе и местах для PDF и Email
      const { data: newOrderData, error: newOrderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            seats (
              *,
              zones (*)
            )
          )
        `)
        .eq('id', orderId)
        .single();
      
      if (newOrderError) throw new Error(`Ошибка получения данных заказа для PDF: ${newOrderError.message}`);

      const orderWithItems = newOrderData as any;

      const orderForPdf: Order = {
        id: orderWithItems.id,
        user_name: orderWithItems.user_name,
        user_email: orderWithItems.user_email,
        total_amount: orderWithItems.total_amount,
        status: orderWithItems.status,
        created_at: orderWithItems.created_at,
      };

      const itemsForPdf: OrderItemWithSeatDetails[] = orderWithItems.order_items.map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        seat_id: item.seat_id,
        price: item.price,
        seat: {
          id: item.seats.id,
          row_number: item.seats.row_number,
          seat_number: item.seats.seat_number,
          zone: {
            id: item.seats.zones.id,
            name: item.seats.zones.name,
            color: item.seats.zones.color,
          }
        }
      }));

      // Генерируем PDF
      const pdfBytes = await generateTicketPdf(orderForPdf, itemsForPdf);
      const pdfBuffer = Buffer.from(pdfBytes);
      const pdfFileName = `ticket-order-${orderId}.pdf`;
      const pdfPath = `${orderId}/${pdfFileName}`;

      // Загружаем PDF в Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('tickets')
        .upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw new Error(`Ошибка загрузки PDF в Storage: ${uploadError.message}`);

      // Получаем публичный URL
      const { data: publicUrlData } = supabase.storage
        .from('tickets')
        .getPublicUrl(pdfPath);

      const pdfUrl = publicUrlData.publicUrl;

      // Обновляем заказ, добавляя ссылку на PDF
      await supabase
        .from('orders')
        .update({ pdf_url: pdfUrl })
        .eq('id', orderId);

      // Готовим данные для email
      const emailHtml = generateTicketEmail({
        userName: name,
        orderId: orderId,
        totalAmount: orderForPdf.total_amount,
        items: itemsForPdf.map(i => ({
          zoneName: i.seat.zone.name,
          rowNumber: i.seat.row_number,
          seatNumber: i.seat.seat_number,
          price: i.price,
        })),
      });

      // Отправляем email с PDF вложением
      await sendEmail({
        to: email,
        subject: `Ваши билеты на концерт! Заказ #${orderId}`,
        html: emailHtml, // Используем сгенерированный HTML
        attachments: [
          {
            filename: pdfFileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

    } catch(emailOrPdfError) {
      // Не фатально, заказ уже создан. Просто логируем ошибку.
      console.error(`Ошибка при генерации PDF или отправке email для заказа ${orderId}:`, emailOrPdfError);
    }
    
    // 6. Отправка ответа (было 4)
    return NextResponse.json({
      success: true,
      orderId,
      message: 'Заказ успешно создан! Билеты отправлены на вашу почту.',
    });

  } catch (error: any) {
    console.error('Ошибка в API /api/orders:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера', details: error.message }, { status: 500 });
  }
}
