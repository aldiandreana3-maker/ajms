CREATE OR REPLACE FUNCTION public.user_owns_unit_number(_user_id uuid, _unit_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid() AND EXISTS (
    SELECT 1
    FROM public.penghuni p
    WHERE p.user_id = auth.uid()
      AND upper(coalesce(p.unit_number, '')) = upper(coalesce(_unit_number, ''))
  )
$$;
REVOKE ALL ON FUNCTION public.user_owns_unit_number(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_unit_number(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_unit_number(uuid, text) TO service_role;