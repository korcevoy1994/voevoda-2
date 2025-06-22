-- Создание таблиц для системы бронирования билетов

-- Таблица событий
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue VARCHAR(255) NOT NULL,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица зон
CREATE TABLE IF NOT EXISTS zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица мест
CREATE TABLE IF NOT EXISTS seats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  seat_number INTEGER NOT NULL,
  x_coordinate DECIMAL(5,2),
  y_coordinate DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'used')),
  reserved_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(zone_id, row_number, seat_number)
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_phone VARCHAR(50),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица элементов заказа
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_seats_zone_status ON seats(zone_id, status);
CREATE INDEX IF NOT EXISTS idx_seats_reserved_until ON seats(reserved_until);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(user_email);
