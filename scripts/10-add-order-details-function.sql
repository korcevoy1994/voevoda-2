CREATE OR REPLACE FUNCTION get_order_details(p_order_id UUID)
RETURNS TABLE (
    order_id UUID,
    user_name TEXT,
    user_email TEXT,
    total_amount DECIMAL,
    order_created_at TIMESTAMPTZ,
    item_id UUID,
    item_price DECIMAL,
    seat_id UUID,
    row_number INT,
    seat_number INT,
    zone_id UUID,
    zone_name TEXT,
    zone_color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id AS order_id,
        o.user_name::TEXT,
        o.user_email::TEXT,
        o.total_amount,
        o.created_at AS order_created_at,
        oi.id AS item_id,
        oi.price AS item_price,
        s.id AS seat_id,
        s.row_number,
        s.seat_number,
        z.id AS zone_id,
        z.name::TEXT AS zone_name,
        z.color::TEXT AS zone_color
    FROM
        orders o
    JOIN
        order_items oi ON o.id = oi.order_id
    JOIN
        seats s ON oi.seat_id = s.id
    JOIN
        zones z ON s.zone_id = z.id
    WHERE
        o.id = p_order_id;
END;
$$ LANGUAGE plpgsql; 