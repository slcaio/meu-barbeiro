-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add RLS policies for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients"
  ON clients
  FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own clients"
  ON clients
  FOR INSERT
  WITH CHECK (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own clients"
  ON clients
  FOR UPDATE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own clients"
  ON clients
  FOR DELETE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

-- Add client_id to appointments table (optional for now, but good for linking)
ALTER TABLE appointments ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
