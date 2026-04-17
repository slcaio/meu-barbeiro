-- ============================================================
-- APPOINTMENT PRODUCTS — Junction table for products sold during appointments
-- ============================================================

CREATE TABLE IF NOT EXISTS appointment_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10,2) NOT NULL,
  barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_appointment_products_quantity CHECK (quantity > 0),
  CONSTRAINT chk_appointment_products_price CHECK (price_at_time >= 0)
);

-- Indexes
CREATE INDEX idx_appointment_products_appointment_id ON appointment_products(appointment_id);
CREATE INDEX idx_appointment_products_product_id ON appointment_products(product_id);

-- RLS
ALTER TABLE appointment_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own appointment products"
  ON appointment_products FOR SELECT
  USING (appointment_id IN (
    SELECT a.id FROM appointments a
    JOIN barbershops b ON b.id = a.barbershop_id
    WHERE b.user_id = auth.uid()
  ));

CREATE POLICY "Owner can insert own appointment products"
  ON appointment_products FOR INSERT
  WITH CHECK (appointment_id IN (
    SELECT a.id FROM appointments a
    JOIN barbershops b ON b.id = a.barbershop_id
    WHERE b.user_id = auth.uid()
  ));

CREATE POLICY "Owner can update own appointment products"
  ON appointment_products FOR UPDATE
  USING (appointment_id IN (
    SELECT a.id FROM appointments a
    JOIN barbershops b ON b.id = a.barbershop_id
    WHERE b.user_id = auth.uid()
  ));

CREATE POLICY "Owner can delete own appointment products"
  ON appointment_products FOR DELETE
  USING (appointment_id IN (
    SELECT a.id FROM appointments a
    JOIN barbershops b ON b.id = a.barbershop_id
    WHERE b.user_id = auth.uid()
  ));

-- Grants
GRANT ALL ON appointment_products TO authenticated;
