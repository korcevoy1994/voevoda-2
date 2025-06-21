-- Добавление мест в зоны на основе SVG схемы зала
-- Этот скрипт создает места для каждой зоны с примерными координатами

DO $$
DECLARE
    zone_record RECORD;
    row_num INTEGER;
    seat_num INTEGER;
    x_coord DECIMAL(5,2);
    y_coord DECIMAL(5,2);
    total_seats INTEGER;
BEGIN
    -- Для каждой зоны создаем места
    FOR zone_record IN SELECT id, name FROM zones LOOP
        
        -- Определяем количество мест и координаты в зависимости от зоны
        CASE zone_record.name
            -- VIP зоны (по 20 мест каждая)
            WHEN 'VIP 1' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 128.0;
            WHEN 'VIP 2' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 259.8;
            WHEN 'VIP 3' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 404.3;
            WHEN 'VIP 4' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 542.5;
            WHEN 'VIP 5' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 600.0;
            WHEN 'VIP 6' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 650.0;
            WHEN 'VIP 7' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 647.5;
            WHEN 'VIP 8' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 647.5;
            WHEN 'VIP 9' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 650.0;
            WHEN 'VIP 10' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 600.0;
            WHEN 'VIP 11' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 542.5;
            WHEN 'VIP 12' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 404.3;
            WHEN 'VIP 13' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 259.8;
            WHEN 'VIP 14' THEN
                total_seats := 20;
                x_coord := 23.1;
                y_coord := 128.0;
            
            -- Зоны балкона (по 30 мест каждая)
            WHEN '201' THEN
                total_seats := 30;
                x_coord := 102.15;
                y_coord := 115.85;
            WHEN '202' THEN
                total_seats := 30;
                x_coord := 102.15;
                y_coord := 223.85;
            WHEN '203' THEN
                total_seats := 30;
                x_coord := 102.15;
                y_coord := 331.85;
            WHEN '204' THEN
                total_seats := 30;
                x_coord := 102.15;
                y_coord := 439.85;
            WHEN '205' THEN
                total_seats := 30;
                x_coord := 102.15;
                y_coord := 547.85;
            WHEN '206' THEN
                total_seats := 30;
                x_coord := 102.15;
                y_coord := 655.85;
            WHEN '207' THEN
                total_seats := 30;
                x_coord := 364.3;
                y_coord := 655.85;
            WHEN '208' THEN
                total_seats := 30;
                x_coord := 492.4;
                y_coord := 655.85;
            WHEN '209' THEN
                total_seats := 30;
                x_coord := 620.5;
                y_coord := 655.85;
            WHEN '210' THEN
                total_seats := 30;
                x_coord := 620.5;
                y_coord := 547.85;
            WHEN '211' THEN
                total_seats := 30;
                x_coord := 620.5;
                y_coord := 439.85;
            WHEN '212' THEN
                total_seats := 30;
                x_coord := 620.5;
                y_coord := 331.85;
            WHEN '213' THEN
                total_seats := 30;
                x_coord := 620.5;
                y_coord := 223.85;
            
            -- General Access (партер) - 200 мест
            WHEN 'GENERAL ACCESS' THEN
                total_seats := 200;
                x_coord := 364.25;
                y_coord := 300.15;
            
            -- По умолчанию
            ELSE
                total_seats := 20;
                x_coord := 100.0;
                y_coord := 100.0;
        END CASE;
        
        -- Создаем места для зоны
        FOR row_num IN 1..CEIL(total_seats::DECIMAL / 10) LOOP
            FOR seat_num IN 1..LEAST(10, total_seats - (row_num - 1) * 10) LOOP
                INSERT INTO seats (zone_id, row_number, seat_number, x_coordinate, y_coordinate, status)
                VALUES (
                    zone_record.id,
                    row_num,
                    seat_num,
                    x_coord + (seat_num - 1) * 8.0,
                    y_coord + (row_num - 1) * 8.0,
                    'available'
                );
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Добавлено % мест в зону %', total_seats, zone_record.name;
    END LOOP;
END $$;

-- Проверяем результат
SELECT 
    z.name,
    COUNT(s.id) as total_seats,
    COUNT(CASE WHEN s.status = 'available' THEN 1 END) as available_seats,
    COUNT(CASE WHEN s.status = 'reserved' THEN 1 END) as reserved_seats,
    COUNT(CASE WHEN s.status = 'sold' THEN 1 END) as sold_seats
FROM zones z
LEFT JOIN seats s ON z.id = s.zone_id
GROUP BY z.id, z.name
ORDER BY z.price DESC, z.name; 