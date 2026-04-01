-- Orphan Order Cleanup Function
-- Deletes orders stuck in 'pending_payment' status for more than X hours.

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_orders(expiry_hours int DEFAULT 24)
RETURNS void AS $$
DECLARE
    deleted_count int;
BEGIN
    -- Delete orders older than expiry_hours that haven't been paid
    -- Order items and proofs will be deleted via cascading foreign keys if configured,
    -- but we'll do it explicitly here to be safe if NOT configured.
    
    -- 1. Delete associated proofs
    DELETE FROM public.proofs
    WHERE order_item_id IN (
        SELECT oi.id 
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        WHERE o.status = 'pending_payment' 
        AND o.created_at < (now() - (expiry_hours || ' hours')::interval)
    );

    -- 2. Delete associated order items
    DELETE FROM public.order_items
    WHERE order_id IN (
        SELECT id FROM public.orders
        WHERE status = 'pending_payment' 
        AND created_at < (now() - (expiry_hours || ' hours')::interval)
    );

    -- 3. Delete the orders
    DELETE FROM public.orders
    WHERE status = 'pending_payment' 
    AND created_at < (now() - (expiry_hours || ' hours')::interval);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % orphaned orders.', deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_orphaned_orders(int) IS 'Purges old pending_payment orders to keep the database clean.';
