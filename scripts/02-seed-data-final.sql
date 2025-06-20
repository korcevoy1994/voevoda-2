-- Заполнение тестовыми данными (финальная версия)
-- Исправлена проблема с неоднозначностью переменных

-- Очищаем существующие данные (если нужно)
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM seats;
-- DELETE FROM zones;
-- DELETE FROM events;

-- Добавляем событие
INSERT INTO events (id, title, description, event_date, venue, poster_url) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 
 'Концерт "Звезды Эстрады"', 
 'Грандиозный концерт с участием лучших артистов страны. Незабываемый вечер музыки и развлечений.',
 '2024-07-15 19:00:00+00',
 'Дворец Спорта "Арена"',
 '/placeholder.svg?height=400&width=600'
) ON CONFLICT (id) DO NOTHING;

-- Добавляем зоны
INSERT INTO zones (id, event_id, name, price, color) VALUES 
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'VIP', 5000.00, '#FFD700'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Партер', 3000.00, '#FF6B6B'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Балкон 201', 2000.00, '#4ECDC4'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Балкон 202', 2000.00, '#45B7D1'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Балкон 203', 1800.00, '#96CEB4')
ON CONFLICT (id) DO NOTHING;

-- Добавляем места для VIP зоны
DO $$
DECLARE
    target_zone_id UUID := '660e8400-e29b-41d4-a716-446655440001';
    current_row INTEGER;
    current_seat INTEGER;
BEGIN
    FOR current_row IN 1..3 LOOP
        FOR current_seat IN 1..10 LOOP
            INSERT INTO seats (zone_id, row_number, seat_number, x_coordinate, y_coordinate, status) 
            VALUES (
                target_zone_id, 
                current_row, 
                current_seat, 
                50.0 + (current_seat - 1) * 30.0, 
                100.0 + (current_row - 1) * 40.0,
                'available'
            ) ON CONFLICT (zone_id, row_number, seat_number) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Added VIP seats: % rows x % seats = % total', 3, 10, 3*10;
END $$;

-- Добавляем места для Партера
DO $$
DECLARE
    target_zone_id UUID := '660e8400-e29b-41d4-a716-446655440002';
    current_row INTEGER;
    current_seat INTEGER;
BEGIN
    FOR current_row IN 1..15 LOOP
        FOR current_seat IN 1..20 LOOP
            INSERT INTO seats (zone_id, row_number, seat_number, x_coordinate, y_coordinate, status) 
            VALUES (
                target_zone_id, 
                current_row, 
                current_seat, 
                30.0 + (current_seat - 1) * 25.0, 
                200.0 + (current_row - 1) * 30.0,
                'available'
            ) ON CONFLICT (zone_id, row_number, seat_number) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Added Партер seats: % rows x % seats = % total', 15, 20, 15*20;
END $$;

-- Добавляем места для балконов
DO $$
DECLARE
    balcony_zone_ids UUID[] := ARRAY[
        '660e8400-e29b-41d4-a716-446655440003',
        '660e8400-e29b-41d4-a716-446655440004', 
        '660e8400-e29b-41d4-a716-446655440005'
    ];
    target_zone_id UUID;
    current_row INTEGER;
    current_seat INTEGER;
    base_y_offset NUMERIC(10,2);
    balcony_index INTEGER;
BEGIN
    FOR balcony_index IN 1..array_length(balcony_zone_ids, 1) LOOP
        target_zone_id := balcony_zone_ids[balcony_index];
        base_y_offset := 700.0 + (balcony_index - 1) * 150.0;
        
        FOR current_row IN 1..8 LOOP
            FOR current_seat IN 1..15 LOOP
                INSERT INTO seats (zone_id, row_number, seat_number, x_coordinate, y_coordinate, status) 
                VALUES (
                    target_zone_id, 
                    current_row, 
                    current_seat, 
                    40.0 + (current_seat - 1) * 28.0, 
                    base_y_offset + (current_row - 1) * 25.0,
                    'available'
                ) ON CONFLICT (zone_id, row_number, seat_number) DO NOTHING;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Added Балкон % seats: % rows x % seats = % total', 
                     200 + balcony_index, 8, 15, 8*15;
    END LOOP;
END $$;
