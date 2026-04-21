
-- Catálogo de serviços
CREATE TABLE public.servicos_catalogo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT,
  valor_padrao NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.servicos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own empresa servicos_catalogo"
  ON public.servicos_catalogo FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa servicos_catalogo"
  ON public.servicos_catalogo FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa servicos_catalogo"
  ON public.servicos_catalogo FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa servicos_catalogo"
  ON public.servicos_catalogo FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE TRIGGER update_servicos_catalogo_updated_at
  BEFORE UPDATE ON public.servicos_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Serviços vinculados a uma OS
CREATE TABLE public.os_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  servico_catalogo_id UUID REFERENCES public.servicos_catalogo(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_os_servicos_ordem ON public.os_servicos(ordem_servico_id);

ALTER TABLE public.os_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own empresa os_servicos"
  ON public.os_servicos FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can insert own empresa os_servicos"
  ON public.os_servicos FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can update own empresa os_servicos"
  ON public.os_servicos FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "Users can delete own empresa os_servicos"
  ON public.os_servicos FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id(auth.uid()));

-- Trigger: recalcular valor_mao_obra ao mudar os_servicos
CREATE OR REPLACE FUNCTION public.sync_os_valor_mao_obra()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  os_id UUID;
  total NUMERIC;
BEGIN
  os_id := COALESCE(NEW.ordem_servico_id, OLD.ordem_servico_id);
  SELECT COALESCE(SUM(quantidade * valor_unitario), 0)
    INTO total
    FROM public.os_servicos
    WHERE ordem_servico_id = os_id;
  UPDATE public.ordens_servico
    SET valor_mao_obra = total
    WHERE id = os_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_os_valor_mao_obra
  AFTER INSERT OR UPDATE OR DELETE ON public.os_servicos
  FOR EACH ROW EXECUTE FUNCTION public.sync_os_valor_mao_obra();
