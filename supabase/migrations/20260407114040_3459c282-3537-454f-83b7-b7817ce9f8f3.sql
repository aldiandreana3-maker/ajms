
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Admin or above can manage all roles
CREATE POLICY "Admin can manage all roles"
ON public.user_roles
FOR ALL
TO public
USING (is_admin_or_above(auth.uid()))
WITH CHECK (is_admin_or_above(auth.uid()));

-- All authenticated users can view all roles (needed for user list display)
CREATE POLICY "Authenticated users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);
