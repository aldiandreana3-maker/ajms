
-- 1. FIX CRITICAL: user_roles - restrict SELECT to own role only (+ admin/master_dev can see all)
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));

-- 2. FIX CRITICAL: agents - restrict public SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view agents" ON public.agents;
CREATE POLICY "Authenticated can view agents" ON public.agents
  FOR SELECT TO authenticated
  USING (true);

-- 3. FIX CRITICAL: password_reset_requests - restrict INSERT to authenticated only
DROP POLICY IF EXISTS "Anyone can submit password reset request" ON public.password_reset_requests;
CREATE POLICY "Authenticated users can submit password reset" ON public.password_reset_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. FIX: agent_gallery public SELECT -> authenticated
DROP POLICY IF EXISTS "Gallery images are viewable by everyone" ON public.agent_gallery;
CREATE POLICY "Authenticated can view gallery" ON public.agent_gallery
  FOR SELECT TO authenticated
  USING (true);

-- 5. FIX: agent_units public SELECT -> authenticated  
DROP POLICY IF EXISTS "Anyone can view agent_units" ON public.agent_units;
CREATE POLICY "Authenticated can view agent_units" ON public.agent_units
  FOR SELECT TO authenticated
  USING (true);
