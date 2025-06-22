-- Обновляем статусы заказов на основе статусов мест
-- Если все места заказа использованы - заказ "completed"
-- Если есть хотя бы одно использованное место - заказ "partially_used"
-- Если все места проданы, но не использованы - заказ "active"

UPDATE orders 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Функция для обновления статуса заказа
CREATE OR REPLACE FUNCTION update_order_status(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    total_seats INTEGER;
    used_seats INTEGER;
    sold_seats INTEGER;
BEGIN
    -- Подсчитываем общее количество мест в заказе
    SELECT COUNT(*) INTO total_seats
    FROM order_items oi
    JOIN seats s ON oi.seat_id = s.id
    WHERE oi.order_id = p_order_id;
    
    -- Подсчитываем использованные места
    SELECT COUNT(*) INTO used_seats
    FROM order_items oi
    JOIN seats s ON oi.seat_id = s.id
    WHERE oi.order_id = p_order_id AND s.status = 'used';
    
    -- Подсчитываем проданные места
    SELECT COUNT(*) INTO sold_seats
    FROM order_items oi
    JOIN seats s ON oi.seat_id = s.id
    WHERE oi.order_id = p_order_id AND s.status = 'sold';
    
    -- Обновляем статус заказа
    IF used_seats = total_seats AND total_seats > 0 THEN
        UPDATE orders SET status = 'completed' WHERE id = p_order_id;
    ELSIF used_seats > 0 THEN
        UPDATE orders SET status = 'partially_used' WHERE id = p_order_id;
    ELSIF sold_seats = total_seats AND total_seats > 0 THEN
        UPDATE orders SET status = 'active' WHERE id = p_order_id;
    ELSE
        UPDATE orders SET status = 'active' WHERE id = p_order_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления статуса заказа при изменении статуса места
CREATE OR REPLACE FUNCTION trigger_update_order_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем статус всех заказов, которые содержат это место
    PERFORM update_order_status(oi.order_id)
    FROM order_items oi
    WHERE oi.seat_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер
DROP TRIGGER IF EXISTS update_order_status_trigger ON seats;
CREATE TRIGGER update_order_status_trigger
    AFTER UPDATE ON seats
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_order_status();

-- Обновляем все существующие заказы
SELECT update_order_status(id) FROM orders; 