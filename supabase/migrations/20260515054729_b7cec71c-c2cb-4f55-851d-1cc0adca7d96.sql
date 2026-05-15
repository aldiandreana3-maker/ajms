-- Update generated columns for water_meters to include abonemen Rp17.000 + usage * Rp12.600
ALTER TABLE public.water_meters DROP COLUMN nominal;
ALTER TABLE public.water_meters DROP COLUMN usage_m3;

ALTER TABLE public.water_meters
  ADD COLUMN usage_m3 NUMERIC GENERATED ALWAYS AS (GREATEST(meter_end - meter_start, 0)) STORED;

ALTER TABLE public.water_meters
  ADD COLUMN nominal NUMERIC GENERATED ALWAYS AS (17000 + GREATEST(meter_end - meter_start, 0) * 12600) STORED;