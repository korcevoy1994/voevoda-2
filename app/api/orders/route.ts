import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { generatePDF } from "@/lib/pdf-generator"
import { generateTicketEmail, sendEmail } from "@/lib/email-service"

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

    // 4. Отправка ответа
    return NextResponse.json({
      success: true,
      orderId,
      message: 'Заказ успешно создан!',
    });

  } catch (error: any) {
    console.error('Ошибка в API /api/orders:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера', details: error.message }, { status: 500 });
  }
}
