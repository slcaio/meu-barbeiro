-- ============================================
-- Migration: Agrupamento técnico para pacotes mensais de agendamentos
-- ============================================

ALTER TABLE public.appointments
  ADD COLUMN batch_id UUID;

CREATE INDEX idx_appointments_barbershop_batch_id
  ON public.appointments(barbershop_id, batch_id)
  WHERE batch_id IS NOT NULL;