
-- Trigger function for OS: auto-create conta when status becomes finalizado/entregue
CREATE OR REPLACE FUNCTION public.auto_create_conta_os()
RETURNS TRIGGER AS $$
DECLARE
  cliente_nome TEXT;
  valor_total NUMERIC;
BEGIN
  -- Only fire when status changes to finalizado or entregue
  IF (NEW.status IN ('finalizado', 'entregue')) AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Check if a conta already exists for this OS
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
          'receber',
          'Serviços',
          CASE WHEN NEW.status = 'entregue' THEN 'recebido' ELSE 'pendente' END,
          NEW.id
        );
      END IF;
    ELSE
      -- If conta exists and status changed to entregue, update to recebido
      IF NEW.status = 'entregue' THEN
        UPDATE public.contas SET status = 'recebido' WHERE ordem_servico_id = NEW.id AND status = 'pendente';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on ordens_servico
CREATE TRIGGER on_os_status_change
  AFTER UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_conta_os();

-- Also fire on insert (if created directly as finalizado)
CREATE TRIGGER on_os_insert_finalizado
  AFTER INSERT ON public.ordens_servico
  FOR EACH ROW
  WHEN (NEW.status IN ('finalizado', 'entregue'))
  EXECUTE FUNCTION public.auto_create_conta_os();

-- Trigger function for Orcamentos: auto-create conta when approved
CREATE OR REPLACE FUNCTION public.auto_create_conta_orcamento()
RETURNS TRIGGER AS $$
DECLARE
  cliente_nome TEXT;
BEGIN
  IF NEW.status = 'aprovado' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Check no duplicate
    IF NOT EXISTS (SELECT 1 FROM public.contas WHERE descricao LIKE NEW.numero || ' -%' AND empresa_id = NEW.empresa_id) THEN
      IF NEW.valor_total > 0 THEN
        SELECT nome INTO cliente_nome FROM public.clientes WHERE id = NEW.cliente_id;
        
        INSERT INTO public.contas (empresa_id, descricao, valor, vencimento, tipo, categoria, status)
        VALUES (
          NEW.empresa_id,
          NEW.numero || ' - ' || COALESCE(cliente_nome, 'Cliente'),
          NEW.valor_total,
          CURRENT_DATE,
          'receber',
          'Orçamentos',
          'pendente'
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on orcamentos
CREATE TRIGGER on_orcamento_aprovado
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_conta_orcamento();
