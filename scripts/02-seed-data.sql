-- Заполнение тестовыми данными

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
    vip_zone_id UUID := '660e8400-e29b-41d4-a716-446655440001';
    row_num INTEGER;
    seat_num INTEGER;
BEGIN
    FOR row_num IN 1..3 LOOP
        FOR seat_num IN 1..10 LOOP
            INSERT INTO seats (zone_id, row_number, seat_number, x_coordinate, y_coordinate, status) 
            VALUES (
                vip_zone_id, 
                row_num, 
                seat_num, 
                50 + (seat_num - 1) * 30, 
                100 + (row_num - 1) * 40,
                'available'
            ) ON CONFLICT (zone_id, row_number, seat_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Добавляем места для Партера
DO $$
DECLARE
    parter_zone_id UUID := '660e8400-e29b-41d4-a716-446655440002';
    row_num INTEGER;
    seat_num INTEGER;
BEGIN
    FOR row_num IN 1..15 LOOP
        FOR seat_num IN 1..20 LOOP
            INSERT INTO seats (zone_id, row_number, seat_number, x_coordinate, y_coordinate, status) 
            VALUES (
                parter_zone_id, 
                row_num, 
                seat_num, 
                30 + (seat_num - 1) * 25, 
                200 + (row_num - 1) * 30,
                'available'
            ) ON CONFLICT (zone_id, row_number, seat_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Добавляем места для балконов
DO $$
DECLARE
    balcony_zones UUID[] := ARRAY[
        '660e8400-e29b-41d4-a716-446655440003',
        '660e8400-e29b-41d4-a716-446655440004', 
        '660e8400-e29b-41d4-a716-446655440005'
    ];
    zone_id UUID;
    row_num INTEGER;
    seat_num INTEGER;
    y_offset INTEGER;
BEGIN
    FOR i IN 1..array_length(balcony_zones, 1) LOOP
        zone_id := balcony_zones[i];
        y_offset := 700 + (i - 1) * 150;
        
        FOR row_num IN 1..8 LOOP
            FOR seat_num IN 1..15 LOOP
                INSERT INTO seats (zone_id, row_number, seat_number, x_coordinate, y_coordinate, status) 
                VALUES (
                    zone_id, 
                    row_num, 
                    seat_num, 
                    40 + (seat_num - 1) * 28, 
                    y_offset + (row_num - 1) * 25,
                    'available'
                ) ON CONFLICT (zone_id, row_number, seat_number) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
