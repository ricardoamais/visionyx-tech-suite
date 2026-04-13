
CREATE OR REPLACE FUNCTION public.auto_create_conta_os()
RETURNS TRIGGER AS $$
DECLARE
  cliente_nome TEXT;
  valor_total NUMERIC;
BEGIN
  IF (NEW.status IN ('finalizado', 'entregue')) AND (OLD IS NULL OR OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NOT EXISTS (SELECT 1 FROM public.contas WHERE ordem_servico_id = NEW.id) THEN
      valor_total := COALESCE(NEW.valor_mao_obra, 0) + COALESCE(NEW.valor_pecas, 0);
      
      IF valor_total > 0 THEN
        SELECT nome INTO cliente_nome FROM public.clientes WHERE id = NEW.cliente_id;
        
        INSERT INTO public.contas (empresa_id, descricao, valor, vencimento, tipo, categoria, status, ordem_servico_id)
        VALUES (
          NEW.empresa_id,
          NEW.numero || ' - ' || COALESCE(cliente_nome, 'Cliente'),
          valor_total,
          CURRENT_DATE,
          'receber'::conta_tipo,
          'Serviços',
          CASE WHEN NEW.status = 'entregue' THEN 'recebido'::conta_status ELSE 'pendente'::conta_status END,
          NEW.id
        );
      END IF;
    ELSE
      IF NEW.status = 'entregue' THEN
        UPDATE public.contas SET status = 'recebido'::conta_status WHERE ordem_servico_id = NEW.id AND status = 'pendente'::conta_status;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_create_conta_orcamento()
RETURNS TRIGGER AS $$
DECLARE
  cliente_nome TEXT;
BEGIN
  IF NEW.status = 'aprovado' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NOT EXISTS (SELECT 1 FROM public.contas WHERE descricao LIKE NEW.numero || ' -%' AND empresa_id = NEW.empresa_id) THEN
      IF NEW.valor_total > 0 THEN
        SELECT nome INTO cliente_nome FROM public.clientes WHERE id = NEW.cliente_id;
        
        INSERT INTO public.contas (empresa_id, descricao, valor, vencimento, tipo, categoria, status)
        VALUES (
          NEW.empresa_id,
          NEW.numero || ' - ' || COALESCE(cliente_nome, 'Cliente'),
          NEW.valor_total,
          CURRENT_DATE,
          'receber'::conta_tipo,
          'Orçamentos',
          'pendente'::conta_status
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
