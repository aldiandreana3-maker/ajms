
-- =====================================================
-- 1. Fix user_roles: ensure only admin+ can manage roles
-- =====================================================

-- Drop any existing policies on user_roles
DROP POLICY IF EXISTS "Admin can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Staff can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Only admin+ can do ALL operations on user_roles
CREATE POLICY "Admin can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin_or_above(auth.uid()))
WITH CHECK (public.is_admin_or_above(auth.uid()));

-- All authenticated users can view roles (needed for RLS helper functions)
CREATE POLICY "Authenticated can view user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- 2. Fix profiles: prevent users from changing their own email
--    (to prevent agent email impersonation in get_user_unit_ids)
-- =====================================================

-- Drop and recreate user self-update policy to exclude email
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- =====================================================
-- 3. Fix kepenghunian_files_update storage policy
-- =====================================================

DROP POLICY IF EXISTS "kepenghunian_files_update" ON storage.objects;

CREATE POLICY "kepenghunian_files_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'kepenghunian-files' AND
  (is_staff_or_above(auth.uid()) OR (auth.uid())::text = (storage.foldername(name))[1])
)
WITH CHECK (
  bucket_id = 'kepenghunian-files' AND
  (is_staff_or_above(auth.uid()) OR (auth.uid())::text = (storage.foldername(name))[1])
);

-- =====================================================
-- 4. Fix packages bucket: make private
-- =====================================================

UPDATE storage.buckets SET public = false WHERE id = 'packages';

DROP POLICY IF EXISTS "Anyone can view package photos" ON storage.objects;

CREATE POLICY "Authenticated can view package photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'packages' AND (is_staff_or_above(auth.uid()) OR auth.uid() IS NOT NULL));

-- =====================================================
-- 5. Fix handle_new_user: remove hardcoded admin auto-assignment
--    Keep only profile creation and default role assignment
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 6. Fix commercial_tenants: restrict to admin only
-- =====================================================

DROP POLICY IF EXISTS "Staff can view commercial tenants" ON public.commercial_tenants;

CREATE POLICY "Admin can view commercial tenants"
ON public.commercial_tenants
FOR SELECT
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- =====================================================
-- 7. Add bill amount constraints via trigger (not CHECK for flexibility)
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_bill_amount()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Bill amount must be positive';
  END IF;
  IF NEW.amount > 1000000000 THEN
    RAISE EXCEPTION 'Bill amount exceeds maximum allowed';
  END IF;
  IF NEW.paid_amount IS NOT NULL AND NEW.paid_amount > NEW.amount THEN
    RAISE EXCEPTION 'Paid amount cannot exceed bill amount';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_bill_amount_trigger ON public.bills;
CREATE TRIGGER validate_bill_amount_trigger
BEFORE INSERT OR UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.validate_bill_amount();

-- =====================================================
-- 8. Add rate limiting on password_reset_requests
-- =====================================================

DROP POLICY IF EXISTS "Anyone can request password reset" ON public.password_reset_requests;

CREATE POLICY "Rate limited password reset requests"
ON public.password_reset_requests
FOR INSERT
WITH CHECK (
  (SELECT count(*) FROM public.password_reset_requests 
   WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
   AND requested_at > now() - interval '24 hours') < 3
  OR auth.uid() IS NOT NULL
);
