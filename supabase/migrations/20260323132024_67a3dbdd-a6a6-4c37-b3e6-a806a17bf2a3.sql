ALTER TABLE public.ordens_servico
  DROP CONSTRAINT IF EXISTS ordens_servico_cliente_id_fkey;
ALTER TABLE public.ordens_servico
  ADD CONSTRAINT ordens_servico_cliente_id_fkey
  FOREIGN KEY (cliente_id)
  REFERENCES public.clientes(id)
  ON DELETE CASCADE;

ALTER TABLE public.orcamentos
  DROP CONSTRAINT IF EXISTS orcamentos_cliente_id_fkey;
ALTER TABLE public.orcamentos
  ADD CONSTRAINT orcamentos_cliente_id_fkey
  FOREIGN KEY (cliente_id)
  REFERENCES public.clientes(id)
  ON DELETE CASCADE;

ALTER TABLE public.ordens_servico
  DROP CONSTRAINT IF EXISTS ordens_servico_equipamento_id_fkey;
ALTER TABLE public.ordens_servico
  ADD CONSTRAINT ordens_servico_equipamento_id_fkey
  FOREIGN KEY (equipamento_id)
  REFERENCES public.equipamentos(id)
  ON DELETE SET NULL;

ALTER TABLE public.contas
  DROP CONSTRAINT IF EXISTS contas_ordem_servico_id_fkey;
ALTER TABLE public.contas
  ADD CONSTRAINT contas_ordem_servico_id_fkey
  FOREIGN KEY (ordem_servico_id)
  REFERENCES public.ordens_servico(id)
  ON DELETE SET NULL;

ALTER TABLE public.orcamentos
  DROP CONSTRAINT IF EXISTS orcamentos_ordem_servico_id_fkey;
ALTER TABLE public.orcamentos
  ADD CONSTRAINT orcamentos_ordem_servico_id_fkey
  FOREIGN KEY (ordem_servico_id)
  REFERENCES public.ordens_servico(id)
  ON DELETE SET NULL;