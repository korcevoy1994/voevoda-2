export interface Event {
  id: string
  title: string
  description: string
  event_date: string
  venue: string
  poster_url: string
  created_at: string
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
