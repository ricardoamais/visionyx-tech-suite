ALTER TABLE public.vendas 
ADD COLUMN ordem_servico_id UUID REFERENCES public.ordens_servico(id),
ADD COLUMN orcamento_id UUID REFERENCES public.orcamentos(id),
ADD COLUMN origem TEXT DEFAULT 'pdv';

COMMENT ON COLUMN public.vendas.origem IS 'Origem da venda: pdv, os, orc';
