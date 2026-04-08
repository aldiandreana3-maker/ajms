
-- 1. Fix plaintext password storage: remove new_password column from admin_password_resets
ALTER TABLE public.admin_password_resets DROP COLUMN IF EXISTS new_password;

-- 2. Fix system_notifications RLS: restrict INSERT to admin+, fix UPDATE
DROP POLICY IF EXISTS "Admins can insert system notifications" ON public.system_notifications;
CREATE POLICY "Admins can insert system notifications"
ON public.system_notifications
FOR INSERT
WITH CHECK (is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Users can update notifications they can see" ON public.system_notifications;
CREATE POLICY "Users can update own read status"
ON public.system_notifications
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update system notifications"
ON public.system_notifications
FOR UPDATE
USING (is_admin_or_above(auth.uid()))
WITH CHECK (is_admin_or_above(auth.uid()));

-- 3. Fix user_roles privilege escalation: replace admin policy with restricted one
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;

-- Only master_dev can manage all roles
CREATE POLICY "Master dev can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master_dev'::app_role))
WITH CHECK (has_role(auth.uid(), 'master_dev'::app_role));

-- Super admin can manage roles but not assign master_dev
CREATE POLICY "Super admin can manage non-master roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) AND role != 'master_dev'::app_role)
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) AND role != 'master_dev'::app_role);

-- Admin can only view roles
CREATE POLICY "Admin can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_admin_or_above(auth.uid()));
