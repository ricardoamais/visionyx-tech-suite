-- Tabela para movimentos de caixa (entradas e saídas avulsas)
CREATE TABLE IF NOT EXISTS public.caixa_movimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    caixa_id UUID REFERENCES public.caixas(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    descricao TEXT NOT NULL,
    valor NUMERIC(15,2) NOT NULL DEFAULT 0,
    forma_pagamento TEXT,
    data_movimento TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_movimentos ENABLE ROW LEVEL SECURITY;

-- Políticas para contratos
DO $$ BEGIN
    CREATE POLICY "Empresas podem ver seus próprios contratos" ON public.contratos
    FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Empresas podem inserir seus próprios contratos" ON public.contratos
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Empresas podem atualizar seus próprios contratos" ON public.contratos
    FOR UPDATE USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Empresas podem deletar seus próprios contratos" ON public.contratos
    FOR DELETE USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Políticas para contrato_pagamentos
DO $$ BEGIN
    CREATE POLICY "Empresas podem ver pagamentos de contratos" ON public.contrato_pagamentos
    FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Empresas podem inserir pagamentos de contratos" ON public.contrato_pagamentos
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Empresas podem atualizar pagamentos de contratos" ON public.contrato_pagamentos
    FOR UPDATE USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Empresas podem deletar pagamentos de contratos" ON public.contrato_pagamentos
    FOR DELETE USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Políticas para caixa_movimentos
DO $$ BEGIN
    CREATE POLICY "Empresas podem ver movimentos de caixa" ON public.caixa_movimentos
    FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Empresas podem inserir movimentos de caixa" ON public.caixa_movimentos
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contratos_company_id ON public.contratos(company_id);
CREATE INDEX IF NOT EXISTS idx_contrato_pagamentos_contrato_id ON public.contrato_pagamentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_caixa_movimentos_caixa_id ON public.caixa_movimentos(caixa_id);
