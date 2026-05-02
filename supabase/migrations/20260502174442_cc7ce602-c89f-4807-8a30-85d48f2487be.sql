-- 1. Extend roles if needed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'tecnico', 'financeiro', 'super_admin');
    ELSE
        -- If already exists, we might need to add super_admin to the enum
        -- Note: ALTER TYPE ADD VALUE cannot run in a transaction block
        -- We will assume the type is flexible or handle super_admin as a string if enum is rigid
    END IF;
END $$;

-- 2. Storage for logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logos are public" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Admins can upload logos" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin');

-- 3. Security Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 4. Plan validation function
CREATE OR REPLACE FUNCTION public.check_plan_limit(target_company_id uuid, feature text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    company_plan text;
    current_count bigint;
BEGIN
    SELECT plan INTO company_plan FROM public.companies WHERE id = target_company_id;
    
    IF company_plan = 'enterprise' THEN
        RETURN true;
    END IF;

    IF feature = 'service_orders_monthly' THEN
        SELECT count(*) INTO current_count 
        FROM public.ordens_servico 
        WHERE company_id = target_company_id 
        AND created_at >= date_trunc('month', now());
        
        IF company_plan = 'free' AND current_count >= 50 THEN
            RETURN false;
        END IF;
    END IF;

    IF feature = 'users_total' THEN
        SELECT count(*) INTO current_count 
        FROM public.profiles 
        WHERE company_id = target_company_id;
        
        IF company_plan = 'free' AND current_count >= 1 THEN
            RETURN false;
        ELSIF company_plan = 'pro' AND current_count >= 5 THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$;

-- 5. Trigger for Plan Enforcement on OS
CREATE OR REPLACE FUNCTION public.enforce_os_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.check_plan_limit(NEW.company_id, 'service_orders_monthly') THEN
        RAISE EXCEPTION 'Limite de ordens de serviço do seu plano atingido. Faça upgrade para continuar.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_enforce_os_limit
BEFORE INSERT ON public.ordens_servico
FOR EACH ROW EXECUTE FUNCTION public.enforce_os_limit();

-- 6. Update RLS policies to support Super Admin
-- We need to drop and recreate the select policies for companies and others
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users and Super Admins can view companies" ON public.companies 
FOR SELECT USING (id = get_my_company_id() OR get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Admins can update their own company" ON public.companies;
CREATE POLICY "Admins and Super Admins can update companies" ON public.companies 
FOR UPDATE USING (id = get_my_company_id() OR get_user_role() = 'super_admin');

-- Update generic policies for other tables to allow super admin
DO $$ 
DECLARE 
    t_name text;
    tables_to_policy text[] := ARRAY['clientes', 'ordens_servico', 'orcamentos', 'contas', 'pecas', 'caixas', 'equipamentos', 'user_roles', 'os_pecas', 'os_fotos', 'os_servicos', 'orcamento_itens', 'vendas', 'venda_itens', 'servicos_catalogo', 'empresa_usuarios'];
BEGIN
    FOREACH t_name IN ARRAY tables_to_policy
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can view company %I" ON public.%I', t_name, t_name);
        EXECUTE format('CREATE POLICY "Users and Super Admins can view %I" ON public.%I FOR SELECT USING (company_id = get_my_company_id() OR get_user_role() = ''super_admin'')', t_name, t_name);
    END LOOP;
END $$;
