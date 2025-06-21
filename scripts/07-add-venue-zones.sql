-- Добавление зон из SVG схемы зала
-- Этот скрипт добавляет все зоны, которые есть в zones.svg

-- Сначала получаем ID события (предполагаем, что у нас есть хотя бы одно событие)
DO $$
DECLARE
    event_uuid UUID;
BEGIN
    -- Получаем ID первого события
    SELECT id INTO event_uuid FROM events LIMIT 1;
    
    -- Если событий нет, создаем тестовое событие
    IF event_uuid IS NULL THEN
        INSERT INTO events (title, description, event_date, venue, poster_url)
        VALUES (
            'Тестовый концерт',
            'Тестовое событие для демонстрации системы бронирования',
            NOW() + INTERVAL '30 days',
            'Главная арена',
            'https://example.com/poster.jpg'
        ) RETURNING id INTO event_uuid;
    END IF;

    -- Добавляем все зоны из SVG схемы
    INSERT INTO zones (event_id, name, price, color) VALUES
        -- VIP зоны
        (event_uuid, 'VIP 1', 15000, '#FFB424'),
        (event_uuid, 'VIP 2', 15000, '#FFB424'),
        (event_uuid, 'VIP 3', 12000, '#D2D3D3'),
        (event_uuid, 'VIP 4', 15000, '#FFB424'),
        (event_uuid, 'VIP 5', 12000, '#D2D3D3'),
        (event_uuid, 'VIP 6', 15000, '#FFB424'),
        (event_uuid, 'VIP 7', 15000, '#FFB424'),
        (event_uuid, 'VIP 8', 15000, '#FFB424'),
        (event_uuid, 'VIP 9', 15000, '#FFB424'),
        (event_uuid, 'VIP 10', 15000, '#FFB424'),
        (event_uuid, 'VIP 11', 15000, '#FFB424'),
        (event_uuid, 'VIP 12', 15000, '#FFB424'),
        (event_uuid, 'VIP 13', 12000, '#D2D3D3'),
        (event_uuid, 'VIP 14', 15000, '#FFB424'),
        
        -- Зоны 201-213 (балкон)
        (event_uuid, '201', 8000, '#4ED784'),
        (event_uuid, '202', 7000, '#A49EFD'),
        (event_uuid, '203', 7000, '#D06EE9'),
        (event_uuid, '204', 7000, '#D06EE9'),
        (event_uuid, '205', 6000, '#F1F298'),
        (event_uuid, '206', 6000, '#FF6877'),
        (event_uuid, '207', 6000, '#FF6877'),
        (event_uuid, '208', 6000, '#FF6877'),
        (event_uuid, '209', 6000, '#F1F298'),
        (event_uuid, '210', 7000, '#D06EE9'),
        (event_uuid, '211', 7000, '#D06EE9'),
        (event_uuid, '212', 7000, '#A49EFD'),
        (event_uuid, '213', 8000, '#4ED784'),
        
        -- General Access (партер)
        (event_uuid, 'GENERAL ACCESS', 5000, '#5BD6D3');

    RAISE NOTICE 'Добавлены зоны для события с ID: %', event_uuid;
END $$;

-- Проверяем результат
SELECT 
    z.name,
    z.price,
    z.color,
    COUNT(s.id) as total_seats,
    COUNT(CASE WHEN s.status = 'available' THEN 1 END) as available_seats
FROM zones z
LEFT JOIN seats s ON z.id = s.zone_id
GROUP BY z.id, z.name, z.price, z.color
ORDER BY z.price DESC, z.name; 