
-- 1. Tariff settings table (singleton)
CREATE TABLE IF NOT EXISTS public.water_tariff_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abonemen numeric NOT NULL DEFAULT 17000,
  price_per_m3 numeric NOT NULL DEFAULT 12600,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.water_tariff_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view water tariff"
  ON public.water_tariff_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin and engineering can manage water tariff"
  ON public.water_tariff_settings FOR ALL
  TO authenticated
  USING (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_engineering'::app_role))
  WITH CHECK (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_engineering'::app_role));

INSERT INTO public.water_tariff_settings (abonemen, price_per_m3)
SELECT 17000, 12600
WHERE NOT EXISTS (SELECT 1 FROM public.water_tariff_settings);

-- 2. Allow staff_engineering to update/delete water_meters
CREATE POLICY "Engineering can update water meters"
  ON public.water_meters FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'staff_engineering'::app_role))
  WITH CHECK (has_role(auth.uid(), 'staff_engineering'::app_role));

CREATE POLICY "Engineering can delete water meters"
  ON public.water_meters FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'staff_engineering'::app_role));

-- 3. Make meter_end default 0 (allow incremental data entry)
ALTER TABLE public.water_meters ALTER COLUMN meter_end SET DEFAULT 0;
ALTER TABLE public.water_meters ALTER COLUMN meter_start SET DEFAULT 0;
