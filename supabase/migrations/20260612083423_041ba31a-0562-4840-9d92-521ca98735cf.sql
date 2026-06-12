
-- Allow status to be NULL (kosong jika belum ada bypass dan normalisasi)
ALTER TABLE public.data_tokens ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.data_tokens ALTER COLUMN status DROP DEFAULT;

-- Auto-set status berdasarkan tanggal
CREATE OR REPLACE FUNCTION public.data_tokens_autostatus()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tanggal_normalisasi IS NOT NULL THEN
    NEW.status := 'normalisasi';
  ELSIF NEW.tanggal_bypass IS NOT NULL THEN
    NEW.status := 'bypass';
  ELSE
    NEW.status := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_data_tokens_autostatus ON public.data_tokens;
CREATE TRIGGER trg_data_tokens_autostatus
BEFORE INSERT OR UPDATE ON public.data_tokens
FOR EACH ROW EXECUTE FUNCTION public.data_tokens_autostatus();

-- Normalisasi data existing
UPDATE public.data_tokens SET status = status;

-- Izinkan semua user terotentikasi (termasuk penghuni & agent) untuk melihat data token
DROP POLICY IF EXISTS "Authenticated can view data_tokens" ON public.data_tokens;
CREATE POLICY "Authenticated can view data_tokens"
ON public.data_tokens FOR SELECT
TO authenticated
USING (true);

GRANT SELECT ON public.data_tokens TO authenticated;
