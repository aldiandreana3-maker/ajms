-- Create packages table for package/parcel management
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id),
  unit_number TEXT,
  owner_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  courier TEXT NOT NULL,
  photo_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'belum_diambil',
  picked_up_at TIMESTAMP WITH TIME ZONE,
  picked_up_by UUID,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view all packages"
ON public.packages
FOR SELECT
USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can manage packages"
ON public.packages
FOR ALL
USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Penghuni can view own packages"
ON public.packages
FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();