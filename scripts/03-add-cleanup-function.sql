-- Функция для автоматической очистки истекших броней

CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS void AS $$
BEGIN
  UPDATE seats 
  SET status = 'available', reserved_until = NULL
  WHERE status = 'reserved' 
    AND reserved_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Создание задачи для периодической очистки (если поддерживается)
-- В реальном проекте это можно настроить через cron или Edge Functions

-- Индекс для оптимизации запросов по времени брони
CREATE INDEX IF NOT EXISTS idx_seats_reserved_until_status 
ON seats(reserved_until, status) 
WHERE status = 'reserved';
