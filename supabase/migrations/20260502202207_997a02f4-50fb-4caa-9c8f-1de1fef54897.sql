-- Fix the get_user_empresa_id function
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT company_id FROM public.empresa_usuarios WHERE user_id = _user_id LIMIT 1
$function$;

-- Helper function to rename column if it exists
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE column_name = 'empresa_id' 
        AND table_schema = 'public'
        AND table_name IN ('ordens_servico', 'orcamentos', 'clientes', 'equipamentos', 'contas', 'pecas', 'caixas', 'os_fotos', 'os_pecas', 'os_servicos', 'orcamento_itens', 'servicos_catalogo', 'vendas', 'venda_itens', 'empresa_usuarios')
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN empresa_id TO company_id', r.table_name);
    END LOOP;
END $$;

-- Ensure company_id exists in all relevant tables
ALTER TABLE IF EXISTS public.ordens_servico ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.orcamentos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.clientes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.equipamentos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.contas ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.pecas ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.caixas ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.os_fotos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.os_pecas ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.os_servicos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.orcamento_itens ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.servicos_catalogo ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.vendas ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.venda_itens ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.empresa_usuarios ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
