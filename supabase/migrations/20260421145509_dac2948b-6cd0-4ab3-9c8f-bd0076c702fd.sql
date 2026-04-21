CREATE OR REPLACE FUNCTION public.auto_create_conta_venda()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.contas (empresa_id, descricao, valor, vencimento, tipo, categoria, status, forma_pagamento)
  VALUES (
    NEW.empresa_id,
    'Venda PDV - ' || to_char(NEW.created_at, 'DD/MM/YYYY HH24:MI'),
    NEW.valor_total,
    CURRENT_DATE,
    'receber'::conta_tipo,
    'PDV',
    'recebido'::conta_status,
    NEW.forma_pagamento::text
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_auto_create_conta_venda ON public.vendas;
CREATE TRIGGER trg_auto_create_conta_venda
AFTER INSERT ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_conta_venda();