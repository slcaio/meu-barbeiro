-- ============================================
-- Migration: Criar tabela barbers e relacionar com appointments
-- ============================================

-- 0. Criar função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Criar tabela barbers
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'barber' NOT NULL CHECK (role IN ('barber', 'senior_barber', 'trainee')),
  avatar_url TEXT,
  commission_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Índices
CREATE INDEX idx_barbers_barbershop_id ON public.barbers(barbershop_id);
CREATE INDEX idx_barbers_active ON public.barbers(barbershop_id, is_active);

-- 3. Adicionar barber_id nos appointments
ALTER TABLE public.appointments
  ADD COLUMN barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL;

CREATE INDEX idx_appointments_barber_id ON public.appointments(barber_id);

-- 4. RLS
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view barbers"
  ON public.barbers FOR SELECT
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert barbers"
  ON public.barbers FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update barbers"
  ON public.barbers FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can delete barbers"
  ON public.barbers FOR DELETE
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

-- 5. Grants
GRANT ALL ON public.barbers TO authenticated;
GRANT SELECT ON public.barbers TO anon;

-- 6. Trigger para updated_at
CREATE TRIGGER update_barbers_updated_at
  BEFORE UPDATE ON public.barbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
