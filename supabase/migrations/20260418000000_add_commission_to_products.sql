-- ============================================================
-- Add commission_percentage to products table
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0;

ALTER TABLE products
  ADD CONSTRAINT chk_products_commission
  CHECK (commission_percentage >= 0 AND commission_percentage <= 100);
