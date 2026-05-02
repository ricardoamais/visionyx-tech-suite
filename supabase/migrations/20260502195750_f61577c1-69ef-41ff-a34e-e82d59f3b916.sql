-- Create bucket public for logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy for authenticated user to upload logos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload logos'
  ) THEN
    CREATE POLICY "Authenticated users can upload logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'company-logos');
  END IF;
END $$;

-- Policy for anyone to view logos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can view logos'
  ) THEN
    CREATE POLICY "Anyone can view logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'company-logos');
  END IF;
END $$;

-- Policy for authenticated users to update logos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update logos'
  ) THEN
    CREATE POLICY "Authenticated users can update logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'company-logos');
  END IF;
END $$;

-- Add logo_url to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS logo_url TEXT;