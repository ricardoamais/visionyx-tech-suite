-- Allow public insertion for companies (authenticated users)
CREATE POLICY "Enable insert for authenticated users" ON public.companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update profiles insertion policy to be more robust
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update user_roles insertion policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND company_id = public.user_roles.company_id
  )
);
