export interface Event {
  id: number;
  name: string;
  description: string | null;
  venue_name: string;
  venue_address: string;
  event_date: string;
  phone_number: string | null;
}

export interface Performer {
  id: number;
  name: string;
  image_url: string | null;
}

export interface PriceRange {
  min_price: number | null;
  max_price: number | null;
}

export interface Zone {
  id: string
  event_id: string
  name: string
  price: number
  color: string
  created_at: string
}

export interface Seat {
  id: string
  zone_id: string
  row_number: number
  seat_number: number
  x_coordinate: number
  y_coordinate: number
  status: "available" | "reserved" | "sold"
  reserved_until?: string
  created_at: string
}

export interface Order {
  id: string
  user_email: string
  user_name: string
  user_phone?: string
  total_amount: number
  status: "pending" | "completed" | "cancelled"
  pdf_url?: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  seat_id: string
  price: number
}

export interface OrderItemWithSeatDetails extends OrderItem {
  seat: {
    id: string;
    row_number: number;
    seat_number: number;
    status: "available" | "reserved" | "sold" | "used";
    zone: {
      id: string;
      name: string;
      color: string;
    };
  };
}

export interface CartItem {
  seat: Seat
  zone: Zone
  price: number
}
