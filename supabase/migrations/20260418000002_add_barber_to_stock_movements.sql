-- ============================================================
-- Add barber_id to stock_movements for commission tracking on standalone sales
-- ============================================================

ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL;
