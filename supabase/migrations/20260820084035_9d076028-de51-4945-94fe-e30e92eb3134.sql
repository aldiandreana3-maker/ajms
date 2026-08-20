CREATE OR REPLACE FUNCTION public.user_owns_unit_number(_user_id uuid, _unit_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.penghuni p
    WHERE p.user_id = _user_id
      AND upper(coalesce(p.unit_number,'')) = upper(coalesce(_unit_number,''))
  )
$$;

CREATE INDEX IF NOT EXISTS idx_penghuni_user_unit ON public.penghuni (user_id, upper(unit_number));
CREATE INDEX IF NOT EXISTS idx_penghuni_updates_updated_at ON public.penghuni_updates (updated_at DESC);

DROP POLICY IF EXISTS "Staff can view all penghuni updates" ON public.penghuni_updates;
DROP POLICY IF EXISTS "Users can view their own penghuni updates" ON public.penghuni_updates;

CREATE POLICY "View penghuni updates" ON public.penghuni_updates
FOR SELECT TO authenticated
USING (
  (SELECT public.is_staff_or_above(auth.uid()))
  OR updated_by = (SELECT auth.uid())
  OR public.user_owns_unit_number((SELECT auth.uid()), unit_number)
);