-- Create categories table for customizable income/expense categories per barbershop
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prevent duplicate category names per barbershop and type
ALTER TABLE public.categories
ADD CONSTRAINT categories_barbershop_name_type_unique UNIQUE (barbershop_id, name, type);

-- Index for faster lookups
CREATE INDEX idx_categories_barbershop_id ON public.categories(barbershop_id);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Users can manage categories from their own barbershop
CREATE POLICY "Users can manage categories from own barbershop"
ON public.categories FOR ALL USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE user_id = auth.uid())
);
