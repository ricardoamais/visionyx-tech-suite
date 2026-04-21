-- Enums
CREATE TYPE public.caixa_status AS ENUM ('aberto', 'fechado');
CREATE TYPE public.venda_pagamento AS ENUM ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix');

-- Tabela caixas
CREATE TABLE public.caixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  user_id UUID NOT NULL,
  valor_abertura NUMERIC NOT NULL DEFAULT 0,
  valor_fechamento NUMERIC,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  status public.caixa_status NOT NULL DEFAULT 'aberto',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own empresa caixas" ON public.caixas FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa caixas" ON public.caixas FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa caixas" ON public.caixas FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa caixas" ON public.caixas FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE TRIGGER update_caixas_updated_at BEFORE UPDATE ON public.caixas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela vendas
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  caixa_id UUID NOT NULL REFERENCES public.caixas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  forma_pagamento public.venda_pagamento NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own empresa vendas" ON public.vendas FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa vendas" ON public.vendas FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa vendas" ON public.vendas FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa vendas" ON public.vendas FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

-- Tabela venda_itens
CREATE TABLE public.venda_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own empresa venda_itens" ON public.venda_itens FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa venda_itens" ON public.venda_itens FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa venda_itens" ON public.venda_itens FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa venda_itens" ON public.venda_itens FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

-- Trigger para deduzir estoque ao registrar item de venda
CREATE OR REPLACE FUNCTION public.deduct_stock_venda()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.pecas SET quantidade = quantidade - NEW.quantidade WHERE id = NEW.peca_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_stock_venda AFTER INSERT ON public.venda_itens
  FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_venda();