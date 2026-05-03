ALTER TABLE public.contas 
ADD COLUMN orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL;