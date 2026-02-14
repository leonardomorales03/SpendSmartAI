-- Performance Optimization Migration
-- 1. Create indices for frequent query patterns
-- 2. Create RPC function for server-side aggregation

-- Index for transaction date filtering per user (Used in Dashboard & Budget)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

-- Index for filtering transactions by category per user (Used in Transaction List)
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category_id);

-- RPC Function to calculate monthly spending by category efficiently
-- This avoids fetching all transaction rows to the application server
CREATE OR REPLACE FUNCTION get_monthly_category_spending(
  p_user_id uuid,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS TABLE (
  category_id uuid,
  total_spent decimal
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.category_id,
    COALESCE(SUM(t.amount), 0) as total_spent
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND t.date >= p_start_date
    AND t.date <= p_end_date
  GROUP BY t.category_id;
END;
$$;
