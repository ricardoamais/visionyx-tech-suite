-- Add columns to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days');
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'active' CHECK (payment_status IN ('active', 'pending', 'overdue', 'blocked'));

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pix_key TEXT NOT NULL,
  pix_name TEXT NOT NULL,
  price_free DECIMAL(10,2) DEFAULT 0,
  price_pro DECIMAL(10,2) DEFAULT 99.90,
  price_enterprise DECIMAL(10,2) DEFAULT 199.90,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only amaiscontratos@gmail.com can manage settings
CREATE POLICY "Only super admin can manage platform settings" 
ON public.platform_settings 
FOR ALL 
USING (auth.jwt() ->> 'email' = 'amaiscontratos@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'amaiscontratos@gmail.com');

-- Policy: All authenticated users can view platform settings (needed for payment)
CREATE POLICY "All authenticated users can view platform settings" 
ON public.platform_settings 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Insert default settings if none exist
INSERT INTO public.platform_settings (pix_key, pix_name, price_free, price_pro, price_enterprise)
SELECT 'amaiscontratos@gmail.com', 'Ricardo Amais', 0, 99.90, 199.90
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);
