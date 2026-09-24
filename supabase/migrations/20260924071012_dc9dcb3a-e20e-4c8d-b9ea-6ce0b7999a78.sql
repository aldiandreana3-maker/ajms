CREATE OR REPLACE FUNCTION public.protect_keluhan_created_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_at IS DISTINCT FROM OLD.created_at
     AND NOT public.is_admin_or_above(auth.uid()) THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengubah tanggal keluhan'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_keluhan_created_at_trigger ON public.keluhan;
CREATE TRIGGER protect_keluhan_created_at_trigger
BEFORE UPDATE OF created_at ON public.keluhan
FOR EACH ROW
EXECUTE FUNCTION public.protect_keluhan_created_at();