-- Create dashboard_settings table to store manual counts (RED category data)
CREATE TABLE public.dashboard_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value integer NOT NULL DEFAULT 0,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view dashboard settings (public dashboard)
CREATE POLICY "Anyone can view dashboard settings"
ON public.dashboard_settings
FOR SELECT
TO public
USING (true);

-- Only super admin can update dashboard settings
CREATE POLICY "Super admin can manage dashboard settings"
ON public.dashboard_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_dashboard_settings_updated_at
BEFORE UPDATE ON public.dashboard_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default values for the three RED category stats
INSERT INTO public.dashboard_settings (setting_key, setting_value, description) VALUES
('total_units', 0, 'Total jumlah unit'),
('penghuni_aktif', 0, 'Total penghuni aktif'),
('data_komersil', 0, 'Total data komersil');