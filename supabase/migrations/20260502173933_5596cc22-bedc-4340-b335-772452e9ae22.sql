-- Rename empresas to companies
ALTER TABLE public.empresas RENAME TO companies;
ALTER TABLE public.companies RENAME COLUMN nome TO name;
ALTER TABLE public.companies RENAME COLUMN cnpj TO document;
ALTER TABLE public.companies RENAME COLUMN telefone TO phone;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Populate profiles.company_id from empresa_usuarios
UPDATE public.profiles p
SET company_id = eu.empresa_id
FROM public.empresa_usuarios eu
WHERE p.user_id = eu.user_id;

-- Rename empresa_id to company_id in all tables
DO $$ 
DECLARE 
    t record;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'empresa_id' AND table_schema = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(t.table_name) || ' RENAME COLUMN empresa_id TO company_id';
    END LOOP;
END $$;

-- Add company_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.user_roles ur
SET company_id = p.company_id
FROM public.profiles p
WHERE ur.user_id = p.user_id;

-- Create helper function for RLS
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Enable RLS on all tables (some might already have it)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;

-- Drop all old policies to avoid conflicts with renamed columns
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- Create new multi-tenant policies

-- Companies
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (id = get_my_company_id());
CREATE POLICY "Admins can update their own company" ON public.companies FOR UPDATE USING (id = get_my_company_id());

-- Profiles
CREATE POLICY "Users can view profiles in their company" ON public.profiles FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Generic macro for other tables
DO $$ 
DECLARE 
    t_name text;
    tables_to_policy text[] := ARRAY['clientes', 'ordens_servico', 'orcamentos', 'contas', 'pecas', 'caixas', 'equipamentos', 'user_roles', 'os_pecas', 'os_fotos', 'os_servicos', 'orcamento_itens', 'vendas', 'venda_itens', 'servicos_catalogo', 'empresa_usuarios'];
BEGIN
    FOREACH t_name IN ARRAY tables_to_policy
    LOOP
        EXECUTE format('CREATE POLICY "Users can view company %I" ON public.%I FOR SELECT USING (company_id = get_my_company_id())', t_name, t_name);
        EXECUTE format('CREATE POLICY "Users can insert company %I" ON public.%I FOR INSERT WITH CHECK (company_id = get_my_company_id())', t_name, t_name);
        EXECUTE format('CREATE POLICY "Users can update company %I" ON public.%I FOR UPDATE USING (company_id = get_my_company_id())', t_name, t_name);
        EXECUTE format('CREATE POLICY "Users can delete company %I" ON public.%I FOR DELETE USING (company_id = get_my_company_id())', t_name, t_name);
    END LOOP;
END $$;
