-- ============================================
-- Migration: Add is_cogs flag to financial_records to separate
-- Cost of Goods Sold from regular expenses (CMV).
-- ============================================

ALTER TABLE public.financial_records
  ADD COLUMN is_cogs BOOLEAN NOT NULL DEFAULT false;

-- Partial index — most queries only need to look up COGS rows
-- to compute the dedicated KPI / filter them out of regular expenses.
CREATE INDEX idx_financial_records_is_cogs
  ON public.financial_records(barbershop_id, record_date)
  WHERE is_cogs = true;

COMMENT ON COLUMN public.financial_records.is_cogs IS
  'When true, this expense record represents Cost of Goods Sold (CMV) from a product sale. Excluded from regular expense KPIs.';
