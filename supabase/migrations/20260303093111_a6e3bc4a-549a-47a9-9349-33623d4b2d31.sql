
-- Create field_inspections table for Laporan Inspeksi Lapangan
CREATE TABLE public.field_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_number TEXT NOT NULL,
  unit_id UUID REFERENCES public.units(id),
  finding_description TEXT NOT NULL,
  photo_before_url TEXT,
  photo_after_url TEXT,
  work_status TEXT NOT NULL DEFAULT 'belum_dikerjakan',
  completed_by UUID,
  completed_by_name TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.field_inspections ENABLE ROW LEVEL SECURITY;

-- TRO & Admin can do everything
CREATE POLICY "Admin and TRO can manage inspections"
ON public.field_inspections
FOR ALL
USING (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_tro'::app_role))
WITH CHECK (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_tro'::app_role));

-- Engineering can view all inspections
CREATE POLICY "Engineering can view inspections"
ON public.field_inspections
FOR SELECT
USING (has_role(auth.uid(), 'staff_engineering'::app_role));

-- Engineering can update inspections (status, photo_after, completed_by)
CREATE POLICY "Engineering can update inspections"
ON public.field_inspections
FOR UPDATE
USING (has_role(auth.uid(), 'staff_engineering'::app_role))
WITH CHECK (has_role(auth.uid(), 'staff_engineering'::app_role));

-- Staff can view inspections
CREATE POLICY "Staff can view inspections"
ON public.field_inspections
FOR SELECT
USING (is_staff_or_above(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_field_inspections_updated_at
BEFORE UPDATE ON public.field_inspections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
