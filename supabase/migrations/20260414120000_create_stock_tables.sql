-- ============================================================
-- STOCK MODULE — Products + Stock Movements
-- ============================================================

-- 1. Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(10) NOT NULL DEFAULT 'un',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_products_barbershop_name UNIQUE (barbershop_id, name),
  CONSTRAINT chk_products_sale_price CHECK (sale_price >= 0),
  CONSTRAINT chk_products_cost_price CHECK (cost_price >= 0),
  CONSTRAINT chk_products_min_stock CHECK (min_stock >= 0),
  CONSTRAINT chk_products_unit CHECK (unit IN ('un', 'ml', 'g', 'kg', 'L'))
);

-- Indexes
CREATE INDEX idx_products_barbershop_id ON products(barbershop_id);
CREATE INDEX idx_products_barbershop_active ON products(barbershop_id, is_active);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own products"
  ON products FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can insert own products"
  ON products FOR INSERT
  WITH CHECK (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can update own products"
  ON products FOR UPDATE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can delete own products"
  ON products FOR DELETE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

-- Grants
GRANT ALL ON products TO authenticated;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- ============================================================
-- 2. Create stock_movements table
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  source VARCHAR(20) NOT NULL,
  reference_id UUID REFERENCES financial_records(id) ON DELETE SET NULL,
  financial_status VARCHAR(20) NOT NULL DEFAULT 'none',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_movement_type CHECK (type IN ('entry', 'exit', 'adjustment')),
  CONSTRAINT chk_movement_quantity CHECK (quantity > 0),
  CONSTRAINT chk_movement_source CHECK (source IN ('manual', 'sale', 'purchase', 'adjustment')),
  CONSTRAINT chk_movement_financial_status CHECK (financial_status IN ('none', 'pending', 'settled'))
);

-- Indexes
CREATE INDEX idx_stock_movements_barbershop_id ON stock_movements(barbershop_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_pending ON stock_movements(barbershop_id, financial_status)
  WHERE financial_status = 'pending';

-- RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own movements"
  ON stock_movements FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can insert own movements"
  ON stock_movements FOR INSERT
  WITH CHECK (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can update own movements"
  ON stock_movements FOR UPDATE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can delete own movements"
  ON stock_movements FOR DELETE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

GRANT ALL ON stock_movements TO authenticated;

-- ============================================================
-- 3. Add stock_movement_id to financial_records
-- ============================================================

ALTER TABLE financial_records
  ADD COLUMN IF NOT EXISTS stock_movement_id UUID
  REFERENCES stock_movements(id) ON DELETE SET NULL;

-- ============================================================
-- 4. RPC function for atomic stock increment/decrement
-- ============================================================

CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET current_stock = current_stock + p_quantity,
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
