-- ============================================
-- Migration: Adicionar suporte a parcelamento em payment_methods
-- ============================================

-- 1. Adicionar flag supports_installments na tabela payment_methods
ALTER TABLE public.payment_methods
  ADD COLUMN supports_installments BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Criar tabela payment_method_installments
CREATE TABLE public.payment_method_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number BETWEEN 2 AND 12),
  fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (fee_percentage >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(payment_method_id, installment_number)
);

-- 3. Índice
CREATE INDEX idx_payment_method_installments_method
  ON public.payment_method_installments(payment_method_id);

-- 4. Adicionar campo installments nos appointments (1 = à vista)
ALTER TABLE public.appointments
  ADD COLUMN installments INTEGER DEFAULT 1 NOT NULL;

-- 5. RLS para payment_method_installments
ALTER TABLE public.payment_method_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view installments"
  ON public.payment_method_installments FOR SELECT
  USING (
    payment_method_id IN (
      SELECT pm.id FROM public.payment_methods pm
      JOIN public.barbershops b ON b.id = pm.barbershop_id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert installments"
  ON public.payment_method_installments FOR INSERT
  WITH CHECK (
    payment_method_id IN (
      SELECT pm.id FROM public.payment_methods pm
      JOIN public.barbershops b ON b.id = pm.barbershop_id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update installments"
  ON public.payment_method_installments FOR UPDATE
  USING (
    payment_method_id IN (
      SELECT pm.id FROM public.payment_methods pm
      JOIN public.barbershops b ON b.id = pm.barbershop_id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can delete installments"
  ON public.payment_method_installments FOR DELETE
  USING (
    payment_method_id IN (
      SELECT pm.id FROM public.payment_methods pm
      JOIN public.barbershops b ON b.id = pm.barbershop_id
      WHERE b.user_id = auth.uid()
    )
  );

-- 6. Grants
GRANT ALL ON public.payment_method_installments TO authenticated;
GRANT SELECT ON public.payment_method_installments TO anon;
