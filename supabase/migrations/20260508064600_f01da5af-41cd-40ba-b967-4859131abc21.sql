
-- Prevent duplicate active parking subscription plates
CREATE OR REPLACE FUNCTION public.prevent_duplicate_active_parking_plate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  norm text;
  existing_id uuid;
BEGIN
  IF NEW.vehicle_number IS NULL OR length(trim(NEW.vehicle_number)) = 0 THEN
    RETURN NEW;
  END IF;
  IF COALESCE(NEW.is_active, true) = false THEN
    RETURN NEW;
  END IF;
  norm := lower(regexp_replace(NEW.vehicle_number, '\s', '', 'g'));

  SELECT id INTO existing_id
  FROM public.parking_subscriptions
  WHERE id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND COALESCE(is_active, true) = true
    AND lower(regexp_replace(vehicle_number, '\s', '', 'g')) = norm
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Nomor plat % sudah terdaftar dan masih aktif. Gunakan menu Perpanjangan.', NEW.vehicle_number
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_active_parking_plate ON public.parking_subscriptions;
CREATE TRIGGER trg_prevent_duplicate_active_parking_plate
BEFORE INSERT OR UPDATE OF vehicle_number, is_active ON public.parking_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_active_parking_plate();
