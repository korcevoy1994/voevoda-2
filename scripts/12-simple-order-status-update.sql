-- Простое обновление статусов заказов
-- Устанавливаем все заказы как активные по умолчанию
UPDATE orders 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Обновляем заказы, где все места использованы
UPDATE orders 
SET status = 'completed'
WHERE id IN (
  SELECT oi.order_id
  FROM order_items oi
  JOIN seats s ON oi.seat_id = s.id
  GROUP BY oi.order_id
  HAVING COUNT(*) = COUNT(CASE WHEN s.status = 'used' THEN 1 END)
  AND COUNT(*) > 0
);

-- Обновляем заказы, где есть хотя бы одно использованное место, но не все
UPDATE orders 
SET status = 'partially_used'
WHERE id IN (
  SELECT oi.order_id
  FROM order_items oi
  JOIN seats s ON oi.seat_id = s.id
  GROUP BY oi.order_id
  HAVING COUNT(CASE WHEN s.status = 'used' THEN 1 END) > 0
  AND COUNT(CASE WHEN s.status = 'used' THEN 1 END) < COUNT(*)
); 