
DROP POLICY IF EXISTS "Super admin can manage system activation" ON public.system_activation;

CREATE POLICY "Admin can manage system activation"
ON public.system_activation
FOR ALL
TO public
USING (is_admin_or_above(auth.uid()))
WITH CHECK (is_admin_or_above(auth.uid()));
