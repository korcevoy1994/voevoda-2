-- Добавляем несколько тестовых заказов для демонстрации

-- Создаем тестовый заказ 1
DO $$
DECLARE
    test_order_id UUID;
    vip_seat_id UUID;
BEGIN
    -- Получаем ID первого VIP места
    SELECT s.id INTO vip_seat_id
    FROM seats s
    JOIN zones z ON s.zone_id = z.id
    WHERE z.name = 'VIP' AND s.status = 'available'
    LIMIT 1;
    
    IF vip_seat_id IS NOT NULL THEN
        -- Создаем заказ
        INSERT INTO orders (user_email, user_name, user_phone, total_amount, status)
        VALUES ('test@example.com', 'Тестовый Пользователь', '+7 999 123-45-67', 5000.00, 'completed')
        RETURNING id INTO test_order_id;
        
        -- Создаем элемент заказа
        INSERT INTO order_items (order_id, seat_id, price)
        VALUES (test_order_id, vip_seat_id, 5000.00);
        
        -- Обновляем статус места
        UPDATE seats SET status = 'sold' WHERE id = vip_seat_id;
        
        RAISE NOTICE 'Created test order with ID: %', test_order_id;
    END IF;
END $$;

-- Создаем тестовый заказ 2 (несколько мест в партере)
DO $$
DECLARE
    test_order_id UUID;
    seat_ids UUID[];
    seat_id UUID;
BEGIN
    -- Получаем ID первых 3 мест в партере
    SELECT array_agg(s.id) INTO seat_ids
    FROM (
        SELECT s.id
        FROM seats s
        JOIN zones z ON s.zone_id = z.id
        WHERE z.name = 'Партер' AND s.status = 'available'
        ORDER BY s.row_number, s.seat_number
        LIMIT 3
    ) s;
    
    IF array_length(seat_ids, 1) >= 3 THEN
        -- Создаем заказ
        INSERT INTO orders (user_email, user_name, total_amount, status)
        VALUES ('family@example.com', 'Семья Ивановых', 9000.00, 'completed')
        RETURNING id INTO test_order_id;
        
        -- Создаем элементы заказа
        FOREACH seat_id IN ARRAY seat_ids LOOP
            INSERT INTO order_items (order_id, seat_id, price)
            VALUES (test_order_id, seat_id, 3000.00);
            
            -- Обновляем статус места
            UPDATE seats SET status = 'sold' WHERE id = seat_id;
        END LOOP;
        
        RAISE NOTICE 'Created family order with ID: %', test_order_id;
    END IF;
END $$;

-- Создаем несколько забронированных мест (истекающих через 5 минут)
DO $$
DECLARE
    seat_ids UUID[];
    seat_id UUID;
    expire_time TIMESTAMP WITH TIME ZONE;
BEGIN
    expire_time := NOW() + INTERVAL '5 minutes';
    
    -- Получаем ID 2 мест в балконе
    SELECT array_agg(s.id) INTO seat_ids
    FROM (
        SELECT s.id
        FROM seats s
        JOIN zones z ON s.zone_id = z.id
        WHERE z.name LIKE 'Балкон%' AND s.status = 'available'
        LIMIT 2
    ) s;
    
    -- Бронируем места
    FOREACH seat_id IN ARRAY seat_ids LOOP
        UPDATE seats 
        SET status = 'reserved', reserved_until = expire_time
        WHERE id = seat_id;
    END LOOP;
    
    RAISE NOTICE 'Reserved % seats until %', array_length(seat_ids, 1), expire_time;
END $$;
