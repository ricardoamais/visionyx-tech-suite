CREATE TABLE public.os_fotos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  ordem_servico_id UUID NOT NULL,
  url TEXT NOT NULL,
  legenda TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_os_fotos_os ON public.os_fotos(ordem_servico_id);

ALTER TABLE public.os_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own empresa os_fotos" ON public.os_fotos
FOR SELECT TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can insert own empresa os_fotos" ON public.os_fotos
FOR INSERT TO authenticated WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can update own empresa os_fotos" ON public.os_fotos
FOR UPDATE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE POLICY "Users can delete own empresa os_fotos" ON public.os_fotos
FOR DELETE TO authenticated USING (empresa_id = get_user_empresa_id(auth.uid()));