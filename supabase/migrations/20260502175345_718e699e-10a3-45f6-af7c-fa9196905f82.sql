-- 1. Drop existing policies on companies to start clean
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Users and Super Admins can view companies" ON public.companies;
DROP POLICY IF EXISTS "Admins and Super Admins can update companies" ON public.companies;
DROP POLICY IF EXISTS "Super Admin full access" ON public.companies;
DROP POLICY IF EXISTS "Users view own company" ON public.companies;
DROP POLICY IF EXISTS "Admins update own company" ON public.companies;

-- 2. Create the fixed policies
-- Permitir que qualquer usuário autenticado insira sua própria empresa
CREATE POLICY "Users can insert their own company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que o usuário veja apenas sua própria empresa
CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.profiles
    WHERE user_id = auth.uid()
  ) OR (auth.jwt() ->> 'email' = 'amaiscontratos@gmail.com')
);

-- Permitir que admin atualize sua própria empresa
CREATE POLICY "Users can update their own company"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.profiles
    WHERE user_id = auth.uid()
  ) OR (auth.jwt() ->> 'email' = 'amaiscontratos@gmail.com')
);

-- Super admin vê tudo (redundante se adicionado acima, mas mantendo para clareza em DELETE e outros)
CREATE POLICY "Super admin full access"
ON public.companies
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'amaiscontratos@gmail.com');
