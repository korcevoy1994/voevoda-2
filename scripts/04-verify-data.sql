-- Проверка созданных данных

-- Проверяем события
SELECT 'Events' as table_name, count(*) as count FROM events;

-- Проверяем зоны
SELECT 'Zones' as table_name, count(*) as count FROM zones;

-- Проверяем места по зонам
SELECT 
    z.name as zone_name,
    z.price,
    count(s.id) as seats_count
FROM zones z
LEFT JOIN seats s ON z.id = s.zone_id
GROUP BY z.id, z.name, z.price
ORDER BY z.price DESC;

-- Общая статистика мест
SELECT 
    status,
    count(*) as count
FROM seats 
GROUP BY status;

-- Проверяем структуру данных
SELECT 
    'Total seats' as info,
    count(*) as value
FROM seats
UNION ALL
SELECT 
    'Available seats' as info,
    count(*) as value
FROM seats 
WHERE status = 'available'
UNION ALL
SELECT 
    'VIP seats' as info,
    count(*) as value
FROM seats s
JOIN zones z ON s.zone_id = z.id
WHERE z.name = 'VIP'
UNION ALL
SELECT 
    'Партер seats' as info,
    count(*) as value
FROM seats s
JOIN zones z ON s.zone_id = z.id
WHERE z.name = 'Партер';
