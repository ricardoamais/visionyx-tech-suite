-- Storage bucket for OS photos
INSERT INTO storage.buckets (id, name, public) VALUES ('os-fotos', 'os-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Add foto_url column to ordens_servico
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- RLS policies for os-fotos bucket
CREATE POLICY "Public read os-fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'os-fotos');

CREATE POLICY "Authenticated upload os-fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'os-fotos');

CREATE POLICY "Authenticated update os-fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'os-fotos');

CREATE POLICY "Authenticated delete os-fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'os-fotos');