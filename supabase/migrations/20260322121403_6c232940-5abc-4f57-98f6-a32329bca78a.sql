
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico');
CREATE TYPE public.os_status AS ENUM ('aberto', 'em_analise', 'aguardando_aprovacao', 'em_manutencao', 'finalizado', 'entregue');
CREATE TYPE public.orcamento_status AS ENUM ('pendente', 'aprovado', 'reprovado');
CREATE TYPE public.conta_tipo AS ENUM ('pagar', 'receber');
CREATE TYPE public.conta_status AS ENUM ('pendente', 'pago', 'recebido', 'vencido');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'tecnico',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tecnico');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CLIENTES
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view clients" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert clients" ON public.clientes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth can update clients" ON public.clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete clients" ON public.clientes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EQUIPAMENTOS
CREATE TABLE public.equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT,
  numero_serie TEXT,
  acessorios TEXT,
  defeito_relatado TEXT,
  senha_equipamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view equipment" ON public.equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert equipment" ON public.equipamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update equipment" ON public.equipamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete equipment" ON public.equipamentos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_equipamentos_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PECAS (INVENTORY)
CREATE TABLE public.pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  valor_compra NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_venda NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view parts" ON public.pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert parts" ON public.pecas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update parts" ON public.pecas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete parts" ON public.pecas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_pecas_updated_at BEFORE UPDATE ON public.pecas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDENS DE SERVICO
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE DEFAULT '',
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  equipamento_id UUID REFERENCES public.equipamentos(id),
  tecnico_id UUID REFERENCES auth.users(id),
  problema_relatado TEXT,
  diagnostico TEXT,
  servicos_realizados TEXT,
  valor_mao_obra NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_pecas NUMERIC(10,2) NOT NULL DEFAULT 0,
  status os_status NOT NULL DEFAULT 'aberto',
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_entrega TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view OS" ON public.ordens_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert OS" ON public.ordens_servico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update OS" ON public.ordens_servico FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete OS" ON public.ordens_servico FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate OS number
CREATE OR REPLACE FUNCTION public.generate_os_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 4) AS INTEGER)), 0) + 1 INTO next_num FROM public.ordens_servico WHERE numero ~ '^OS-[0-9]+$';
  NEW.numero := 'OS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END; $$;

CREATE TRIGGER set_os_number BEFORE INSERT ON public.ordens_servico FOR EACH ROW WHEN (NEW.numero IS NULL OR NEW.numero = '') EXECUTE FUNCTION public.generate_os_number();

-- OS PECAS
CREATE TABLE public.os_pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.os_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage os_pecas" ON public.os_pecas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto deduct stock
CREATE OR REPLACE FUNCTION public.deduct_stock()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN UPDATE public.pecas SET quantidade = quantidade - NEW.quantidade WHERE id = NEW.peca_id; RETURN NEW; END; $$;
CREATE TRIGGER deduct_stock_on_os_peca AFTER INSERT ON public.os_pecas FOR EACH ROW EXECUTE FUNCTION public.deduct_stock();

-- ORCAMENTOS
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE DEFAULT '',
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status orcamento_status NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  ordem_servico_id UUID REFERENCES public.ordens_servico(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage orcamentos" ON public.orcamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_orc_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 5) AS INTEGER)), 0) + 1 INTO next_num FROM public.orcamentos WHERE numero ~ '^ORC-[0-9]+$';
  NEW.numero := 'ORC-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END; $$;
CREATE TRIGGER set_orc_number BEFORE INSERT ON public.orcamentos FOR EACH ROW WHEN (NEW.numero IS NULL OR NEW.numero = '') EXECUTE FUNCTION public.generate_orc_number();

-- ORCAMENTO ITENS
CREATE TABLE public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage orcamento_itens" ON public.orcamento_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CONTAS (FINANCEIRO)
CREATE TABLE public.contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo conta_tipo NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  categoria TEXT,
  forma_pagamento TEXT,
  parcelas INTEGER DEFAULT 1,
  status conta_status NOT NULL DEFAULT 'pendente',
  ordem_servico_id UUID REFERENCES public.ordens_servico(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage contas" ON public.contas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_contas_updated_at BEFORE UPDATE ON public.contas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EMPRESA CONFIG
CREATE TABLE public.empresa_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT 'Visionyx Assistência Técnica',
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  logo_url TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view config" ON public.empresa_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage config" ON public.empresa_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_empresa_config_updated_at BEFORE UPDATE ON public.empresa_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.empresa_config (nome, cnpj, telefone, email, endereco)
VALUES ('Visionyx Assistência Técnica', '12.345.678/0001-90', '(11) 3456-7890', 'contato@visionyx.com.br', 'Rua da Tecnologia, 123 - São Paulo/SP');
