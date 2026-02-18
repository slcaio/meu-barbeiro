-- Create users table extending auth.users
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Create barbershops table
CREATE TABLE public.barbershops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    address JSONB NOT NULL,
    operating_hours JSONB NOT NULL DEFAULT '[{"day": "monday", "open": "09:00", "close": "18:00", "closed": false}, {"day": "tuesday", "open": "09:00", "close": "18:00", "closed": false}, {"day": "wednesday", "open": "09:00", "close": "18:00", "closed": false}, {"day": "thursday", "open": "09:00", "close": "18:00", "closed": false}, {"day": "friday", "open": "09:00", "close": "18:00", "closed": false}, {"day": "saturday", "open": "09:00", "close": "14:00", "closed": false}, {"day": "sunday", "open": "00:00", "close": "00:00", "closed": true}]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for barbershops
CREATE INDEX idx_barbershops_user_id ON public.barbershops(user_id);

-- Enable RLS for barbershops
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;

-- Create policies for barbershops
CREATE POLICY "Users can manage own barbershop" ON public.barbershops FOR ALL USING (auth.uid() = user_id);
-- Allow public read access to barbershops (for clients to see available barbershops)
CREATE POLICY "Public can view barbershops" ON public.barbershops FOR SELECT USING (true);

-- Create services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for services
CREATE INDEX idx_services_barbershop_id ON public.services(barbershop_id);

-- Enable RLS for services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies for services
CREATE POLICY "Users can manage services from own barbershop" ON public.services FOR ALL USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE user_id = auth.uid())
);
-- Allow public read access to services (for clients to see services)
CREATE POLICY "Public can view services" ON public.services FOR SELECT USING (true);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- The barber/owner
    client_name VARCHAR(100) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for appointments
CREATE INDEX idx_appointments_barbershop_id ON public.appointments(barbershop_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- Enable RLS for appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Users can manage appointments from own barbershop" ON public.appointments FOR ALL USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE user_id = auth.uid())
);
-- Allow public to insert appointments (for booking) - strict check might be needed later
CREATE POLICY "Public can create appointments" ON public.appointments FOR INSERT WITH CHECK (true); 

-- Create financial_records table
CREATE TABLE public.financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for financial_records
CREATE INDEX idx_financial_records_barbershop_id ON public.financial_records(barbershop_id);
CREATE INDEX idx_financial_records_date ON public.financial_records(record_date);

-- Enable RLS for financial_records
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_records
CREATE POLICY "Users can manage financial records from own barbershop" ON public.financial_records FOR ALL USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE user_id = auth.uid())
);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant permissions to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
