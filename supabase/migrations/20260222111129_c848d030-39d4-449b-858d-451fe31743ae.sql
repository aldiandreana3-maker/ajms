
-- Create water_meters table
CREATE TABLE public.water_meters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id),
  unit_number TEXT NOT NULL,
  penghuni_name TEXT,
  photo_url TEXT,
  meter_start NUMERIC NOT NULL DEFAULT 0,
  meter_end NUMERIC NOT NULL DEFAULT 0,
  usage_m3 NUMERIC GENERATED ALWAYS AS (meter_end - meter_start) STORED,
  nominal NUMERIC GENERATED ALWAYS AS ((meter_end - meter_start) * 17000) STORED,
  billing_month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE),
  recorded_by UUID,
  recorded_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate entries for same unit in same month
  UNIQUE(unit_number, billing_month)
);

-- Enable RLS
ALTER TABLE public.water_meters ENABLE ROW LEVEL SECURITY;

-- Engineering staff, admin, super_admin can insert
CREATE POLICY "Engineering and admin can insert water meters"
ON public.water_meters
FOR INSERT
TO authenticated
WITH CHECK (
  is_staff_or_above(auth.uid())
);

-- Engineering staff, admin can view all
CREATE POLICY "Staff can view all water meters"
ON public.water_meters
FOR SELECT
TO authenticated
USING (
  is_staff_or_above(auth.uid())
  OR (unit_id IN (SELECT get_user_unit_ids(auth.uid()) AS get_user_unit_ids))
);

-- Admin can manage (update/delete)
CREATE POLICY "Admin can manage water meters"
ON public.water_meters
FOR ALL
TO authenticated
USING (is_admin_or_above(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_water_meters_updated_at
BEFORE UPDATE ON public.water_meters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
