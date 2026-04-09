
-- 1. Create empresas table
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  whatsapp TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create empresa_usuarios junction table
CREATE TABLE public.empresa_usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'tecnico',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, user_id)
);

ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to get user's empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = _user_id LIMIT 1
$$;

-- 4. Migrate existing empresa_config data into empresas
INSERT INTO public.empresas (id, nome, cnpj, telefone, email, endereco, whatsapp, logo_url, created_at, updated_at)
SELECT id, nome, cnpj, telefone, email, endereco, whatsapp, logo_url, created_at, updated_at
FROM public.empresa_config
LIMIT 1;

-- If no empresa_config row exists, insert a default
INSERT INTO public.empresas (nome)
SELECT 'Empresa Padrão'
WHERE NOT EXISTS (SELECT 1 FROM public.empresas);

-- 5. Associate all existing users with the default empresa
INSERT INTO public.empresa_usuarios (empresa_id, user_id, role)
SELECT 
  (SELECT id FROM public.empresas LIMIT 1),
  ur.user_id,
  ur.role
FROM public.user_roles ur
ON CONFLICT (empresa_id, user_id) DO NOTHING;

-- 6. Add empresa_id to all data tables
ALTER TABLE public.clientes ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.equipamentos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.ordens_servico ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.orcamentos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.contas ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.pecas ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.os_pecas ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.orcamento_itens ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);

-- 7. Set existing data to the default empresa
UPDATE public.clientes SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;
UPDATE public.equipamentos SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;
UPDATE public.ordens_servico SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;
UPDATE public.orcamentos SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;
UPDATE public.contas SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;
UPDATE public.pecas SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;
UPDATE public.os_pecas SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;
UPDATE public.orcamento_itens SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;

-- 8. Make empresa_id NOT NULL
ALTER TABLE public.clientes ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.equipamentos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.ordens_servico ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.orcamentos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.contas ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.pecas ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.os_pecas ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.orcamento_itens ALTER COLUMN empresa_id SET NOT NULL;

-- 9. Drop all old RLS policies and recreate with empresa_id filtering

-- clientes
DROP POLICY IF EXISTS "Auth can delete clients" ON public.clientes;
DROP POLICY IF EXISTS "Auth can insert clients" ON public.clientes;
DROP POLICY IF EXISTS "Auth can update clients" ON public.clientes;
DROP POLICY IF EXISTS "Auth can view clients" ON public.clientes;

CREATE POLICY "Users can view own empresa clients" ON public.clientes FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa clients" ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa clients" ON public.clientes FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa clients" ON public.clientes FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- equipamentos
DROP POLICY IF EXISTS "Auth can delete equipment" ON public.equipamentos;
DROP POLICY IF EXISTS "Auth can insert equipment" ON public.equipamentos;
DROP POLICY IF EXISTS "Auth can update equipment" ON public.equipamentos;
DROP POLICY IF EXISTS "Auth can view equipment" ON public.equipamentos;

CREATE POLICY "Users can view own empresa equipment" ON public.equipamentos FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa equipment" ON public.equipamentos FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa equipment" ON public.equipamentos FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa equipment" ON public.equipamentos FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- ordens_servico
DROP POLICY IF EXISTS "Auth can delete OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Auth can insert OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Auth can update OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Auth can view OS" ON public.ordens_servico;

CREATE POLICY "Users can view own empresa OS" ON public.ordens_servico FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa OS" ON public.ordens_servico FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa OS" ON public.ordens_servico FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa OS" ON public.ordens_servico FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- orcamentos
DROP POLICY IF EXISTS "Auth can manage orcamentos" ON public.orcamentos;

CREATE POLICY "Users can view own empresa orcamentos" ON public.orcamentos FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa orcamentos" ON public.orcamentos FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa orcamentos" ON public.orcamentos FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa orcamentos" ON public.orcamentos FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- contas
DROP POLICY IF EXISTS "Auth can manage contas" ON public.contas;

CREATE POLICY "Users can view own empresa contas" ON public.contas FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa contas" ON public.contas FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa contas" ON public.contas FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa contas" ON public.contas FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- pecas
DROP POLICY IF EXISTS "Auth can delete parts" ON public.pecas;
DROP POLICY IF EXISTS "Auth can insert parts" ON public.pecas;
DROP POLICY IF EXISTS "Auth can update parts" ON public.pecas;
DROP POLICY IF EXISTS "Auth can view parts" ON public.pecas;

CREATE POLICY "Users can view own empresa parts" ON public.pecas FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa parts" ON public.pecas FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa parts" ON public.pecas FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa parts" ON public.pecas FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- os_pecas
DROP POLICY IF EXISTS "Auth can manage os_pecas" ON public.os_pecas;

CREATE POLICY "Users can view own empresa os_pecas" ON public.os_pecas FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa os_pecas" ON public.os_pecas FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa os_pecas" ON public.os_pecas FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa os_pecas" ON public.os_pecas FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- orcamento_itens
DROP POLICY IF EXISTS "Auth can manage orcamento_itens" ON public.orcamento_itens;

CREATE POLICY "Users can view own empresa orcamento_itens" ON public.orcamento_itens FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa orcamento_itens" ON public.orcamento_itens FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa orcamento_itens" ON public.orcamento_itens FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa orcamento_itens" ON public.orcamento_itens FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- 10. RLS for empresas table
CREATE POLICY "Users can view own empresa" ON public.empresas FOR SELECT TO authenticated
  USING (id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Admins can update own empresa" ON public.empresas FOR UPDATE TO authenticated
  USING (id = public.get_user_empresa_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- 11. RLS for empresa_usuarios table
CREATE POLICY "Users can view own empresa users" ON public.empresa_usuarios FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "Admins can manage empresa users" ON public.empresa_usuarios FOR ALL TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- 12. Update handle_new_user to NOT auto-assign empresa (admin will do it)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tecnico');
  RETURN NEW;
END;
$$;

-- 13. Update OS number generator to be empresa-scoped
CREATE OR REPLACE FUNCTION public.generate_os_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.ordens_servico
  WHERE numero ~ '^OS-[0-9]+$' AND empresa_id = NEW.empresa_id;
  NEW.numero := 'OS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- 14. Update ORC number generator to be empresa-scoped
CREATE OR REPLACE FUNCTION public.generate_orc_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.orcamentos
  WHERE numero ~ '^ORC-[0-9]+$' AND empresa_id = NEW.empresa_id;
  NEW.numero := 'ORC-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- 15. Update deduct_stock to be empresa-aware (no change needed, peca_id is already scoped)

-- 16. Drop empresa_config table
DROP TABLE public.empresa_config;
