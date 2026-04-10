-- ============================================
-- Migration: Criar tabela payment_methods e relacionar com appointments/financial_records
-- ============================================

-- 1. Criar tabela payment_methods
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  fee_type VARCHAR(10) NOT NULL DEFAULT 'percentage' CHECK (fee_type IN ('percentage', 'fixed')),
  fee_value DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (fee_value >= 0),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Índices
CREATE INDEX idx_payment_methods_barbershop_id ON public.payment_methods(barbershop_id);
CREATE INDEX idx_payment_methods_active ON public.payment_methods(barbershop_id, is_active);

-- 3. Adicionar payment_method_id nos appointments
ALTER TABLE public.appointments
  ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- 4. Adicionar payment_method_id nos financial_records
ALTER TABLE public.financial_records
  ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- 5. RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view payment_methods"
  ON public.payment_methods FOR SELECT
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert payment_methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update payment_methods"
  ON public.payment_methods FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can delete payment_methods"
  ON public.payment_methods FOR DELETE
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

-- 6. Grants
GRANT ALL ON public.payment_methods TO authenticated;
GRANT SELECT ON public.payment_methods TO anon;

-- 7. Trigger para updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
