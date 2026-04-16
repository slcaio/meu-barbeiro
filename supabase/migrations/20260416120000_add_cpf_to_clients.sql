-- Add CPF column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Optional index for CPF lookups per barbershop
CREATE INDEX IF NOT EXISTS idx_clients_barbershop_cpf ON clients(barbershop_id, cpf);
