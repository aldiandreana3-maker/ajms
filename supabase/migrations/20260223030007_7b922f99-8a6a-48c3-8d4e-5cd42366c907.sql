-- Add separate photo columns for meter start and meter end
ALTER TABLE public.water_meters ADD COLUMN photo_start_url text;
ALTER TABLE public.water_meters ADD COLUMN photo_end_url text;

-- Migrate existing photo_url to photo_start_url
UPDATE public.water_meters SET photo_start_url = photo_url WHERE photo_url IS NOT NULL;
