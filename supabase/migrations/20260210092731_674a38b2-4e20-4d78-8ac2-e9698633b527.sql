
-- Create bill_rates table for configurable rates by unit area type
CREATE TABLE public.bill_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_label text NOT NULL,
  area_sqm numeric NOT NULL,
  quarterly_amount numeric NOT NULL,
  monthly_amount numeric GENERATED ALWAYS AS (ROUND(quarterly_amount / 3, 0)) STORED,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bill_rates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view rates
CREATE POLICY "Anyone can view bill rates"
ON public.bill_rates FOR SELECT
USING (true);

-- Only admin/super_admin can manage rates
CREATE POLICY "Admin can manage bill rates"
ON public.bill_rates FOR ALL
USING (is_admin_or_above(auth.uid()))
WITH CHECK (is_admin_or_above(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_bill_rates_updated_at
BEFORE UPDATE ON public.bill_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rates
INSERT INTO public.bill_rates (area_label, area_sqm, quarterly_amount) VALUES
  ('Tipe 18.5 m²', 18.5, 666000),
  ('Tipe 24 m²', 24, 864000),
  ('Tipe 33 m²', 33, 1188000),
  ('Tipe 40 m²', 40, 1440000);
