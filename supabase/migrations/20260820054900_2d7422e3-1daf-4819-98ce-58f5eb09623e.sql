CREATE OR REPLACE FUNCTION public.user_owns_unit_number(_user_id uuid, _unit_number text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.penghuni p
    WHERE p.user_id = _user_id
      AND upper(coalesce(p.unit_number, '')) = upper(coalesce(_unit_number, ''))
  ) OR EXISTS (
    SELECT 1 FROM public.units u
    WHERE upper(coalesce(u.unit_number, '')) = upper(coalesce(_unit_number, ''))
      AND u.id IN (SELECT public.get_user_unit_ids(_user_id))
  )
$$;

DROP POLICY IF EXISTS "Users can update their own penghuni updates" ON public.penghuni_updates;
CREATE POLICY "Users can update their own penghuni updates"
ON public.penghuni_updates FOR UPDATE TO authenticated
USING (updated_by = auth.uid() OR is_staff_or_above(auth.uid()) OR public.user_owns_unit_number(auth.uid(), unit_number))
WITH CHECK (updated_by = auth.uid() OR is_staff_or_above(auth.uid()) OR public.user_owns_unit_number(auth.uid(), unit_number));

DROP POLICY IF EXISTS "Users can view their own penghuni updates" ON public.penghuni_updates;
CREATE POLICY "Users can view their own penghuni updates"
ON public.penghuni_updates FOR SELECT TO authenticated
USING (updated_by = auth.uid() OR public.user_owns_unit_number(auth.uid(), unit_number));