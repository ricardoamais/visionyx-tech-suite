
-- Drop admin-only delete policies
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clientes;
DROP POLICY IF EXISTS "Admins can delete equipment" ON public.equipamentos;
DROP POLICY IF EXISTS "Admins can delete OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins can delete parts" ON public.pecas;

-- Create new delete policies for all authenticated users
CREATE POLICY "Auth can delete clients" ON public.clientes FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth can delete equipment" ON public.equipamentos FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth can delete OS" ON public.ordens_servico FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth can delete parts" ON public.pecas FOR DELETE TO authenticated USING (true);
