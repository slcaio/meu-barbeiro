-- ============================================================
-- Add photo_url to products + create product-photos storage bucket
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create public bucket for product photos (2MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-photos',
  'product-photos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload product photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-photos' AND auth.role() = 'authenticated');

-- RLS: public read
CREATE POLICY "Public can view product photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-photos');

-- RLS: authenticated users can delete
CREATE POLICY "Authenticated users can delete product photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-photos' AND auth.role() = 'authenticated');

-- RLS: authenticated users can update/replace
CREATE POLICY "Authenticated users can update product photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-photos' AND auth.role() = 'authenticated');
