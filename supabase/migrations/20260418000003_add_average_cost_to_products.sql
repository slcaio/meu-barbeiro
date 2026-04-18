-- ============================================================
-- Add average_cost column to products table
-- Tracks the Weighted Average Cost (WAC) of items in stock,
-- recalculated automatically on each stock entry.
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS average_cost DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Seed existing products with their current cost_price as approximation
UPDATE products SET average_cost = cost_price WHERE average_cost = 0;

-- Constraint: average_cost cannot be negative
ALTER TABLE products
  ADD CONSTRAINT chk_products_average_cost CHECK (average_cost >= 0);
