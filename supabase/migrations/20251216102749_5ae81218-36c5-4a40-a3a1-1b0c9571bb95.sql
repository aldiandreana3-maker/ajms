-- Create foreign guest reports table
CREATE TABLE public.foreign_guest_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id),
  full_name TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('pria', 'wanita')),
  nationality TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  passport_expiry DATE NOT NULL,
  passport_photo_url TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.foreign_guest_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staff can manage foreign guest reports"
ON public.foreign_guest_reports
FOR ALL
USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can view all foreign guest reports"
ON public.foreign_guest_reports
FOR SELECT
USING (is_staff_or_above(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_foreign_guest_reports_updated_at
BEFORE UPDATE ON public.foreign_guest_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();