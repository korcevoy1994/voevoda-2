-- Финальная проверка всех данных

-- Общая статистика
SELECT 
    'ОБЩАЯ СТАТИСТИКА' as section,
    '' as name,
    '' as details,
    0 as count
UNION ALL

-- События
SELECT 
    'События' as section,
    title as name,
    venue as details,
    1 as count
FROM events

UNION ALL

-- Зоны с количеством мест
SELECT 
    'Зоны' as section,
    z.name as name,
    z.price::text || ' ₽' as details,
    count(s.id)::integer as count
FROM zones z
LEFT JOIN seats s ON z.id = s.zone_id
GROUP BY z.id, z.name, z.price
ORDER BY section, count DESC;

-- Статистика по статусам мест
SELECT 
    'Статус мест' as info,
    status as status,
    count(*) as count,
    round(count(*) * 100.0 / sum(count(*)) OVER (), 1) as percentage
FROM seats 
GROUP BY status
ORDER BY count DESC;

-- Проверка координат (должны быть не NULL)
SELECT 
    'Проверка координат' as info,
    'Места без координат' as status,
    count(*) as count,
    0.0 as percentage
FROM seats 
WHERE x_coordinate IS NULL OR y_coordinate IS NULL;

-- Проверка целостности данных
SELECT 
    'Целостность данных' as info,
    'Места без зон' as status,
    count(*) as count,
    0.0 as percentage
FROM seats s
LEFT JOIN zones z ON s.zone_id = z.id
WHERE z.id IS NULL;

-- Итоговая сводка
SELECT 
    '=== ИТОГО ===' as info,
    'Всего мест создано' as status,
    count(*) as count,
    100.0 as percentage
FROM seats;
