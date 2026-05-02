-- 1. Update RLS policies for companies
DROP POLICY IF EXISTS "Users and Super Admins can view companies" ON public.companies;
DROP POLICY IF EXISTS "Admins and Super Admins can update companies" ON public.companies;

-- Policy for the specific super admin email
CREATE POLICY "Super Admin full access" ON public.companies 
FOR ALL USING (auth.jwt() ->> 'email' = 'amaiscontratos@gmail.com');

-- Policy for regular users (only their own company)
CREATE POLICY "Users view own company" ON public.companies 
FOR SELECT USING (id = get_my_company_id());

CREATE POLICY "Admins update own company" ON public.companies 
FOR UPDATE USING (id = get_my_company_id() AND (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin');

-- 2. Update other tables to allow Super Admin email access
DO $$ 
DECLARE 
    t_name text;
    tables_to_policy text[] := ARRAY['clientes', 'ordens_servico', 'orcamentos', 'contas', 'pecas', 'caixas', 'equipamentos', 'user_roles', 'os_pecas', 'os_fotos', 'os_servicos', 'orcamento_itens', 'vendas', 'venda_itens', 'servicos_catalogo', 'empresa_usuarios'];
BEGIN
    FOREACH t_name IN ARRAY tables_to_policy
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users and Super Admins can view %I" ON public.%I', t_name, t_name);
        EXECUTE format('CREATE POLICY "Super Admin view %I" ON public.%I FOR SELECT USING (auth.jwt() ->> ''email'' = ''amaiscontratos@gmail.com'')', t_name, t_name);
        EXECUTE format('CREATE POLICY "Users view own %I" ON public.%I FOR SELECT USING (company_id = get_my_company_id())', t_name, t_name);
    END LOOP;
END $$;
