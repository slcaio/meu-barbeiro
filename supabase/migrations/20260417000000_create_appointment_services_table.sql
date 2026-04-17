-- ============================================
-- Migration: Criar tabela appointment_services (múltiplos serviços por agendamento)
-- e migrar dados existentes de appointments.service_id
-- ============================================

-- 1. Criar tabela junction appointment_services
CREATE TABLE public.appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price_at_time DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(appointment_id, service_id)
);

-- 2. Índices
CREATE INDEX idx_appointment_services_appointment_id ON public.appointment_services(appointment_id);
CREATE INDEX idx_appointment_services_service_id ON public.appointment_services(service_id);

-- 3. RLS
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage appointment_services from own barbershop"
  ON public.appointment_services FOR ALL
  USING (
    appointment_id IN (
      SELECT a.id FROM public.appointments a
      WHERE a.barbershop_id IN (
        SELECT b.id FROM public.barbershops b WHERE b.user_id = auth.uid()
      )
    )
  );

-- 4. Migrar dados existentes: cada appointment com service_id vira 1 row em appointment_services
INSERT INTO public.appointment_services (appointment_id, service_id, price_at_time)
SELECT a.id, a.service_id, a.total_amount
FROM public.appointments a
WHERE a.service_id IS NOT NULL;

-- 5. Remover coluna service_id da tabela appointments
ALTER TABLE public.appointments DROP COLUMN service_id;
