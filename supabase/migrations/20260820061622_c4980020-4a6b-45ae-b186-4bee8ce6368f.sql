REVOKE ALL ON FUNCTION public.user_owns_unit_number(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_unit_number(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_unit_number(uuid, text) TO service_role;