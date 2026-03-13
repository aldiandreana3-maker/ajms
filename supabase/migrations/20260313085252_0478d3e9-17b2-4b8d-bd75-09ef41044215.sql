
-- Create electric_meters table
CREATE TABLE public.electric_meters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  unit_number text NOT NULL,
  meter_number text NOT NULL,
  meter_type text NOT NULL DEFAULT 'prabayar',
  penghuni_name text,
  install_date date,
  meter_status text NOT NULL DEFAULT 'aktif',
  kwh_balance numeric NOT NULL DEFAULT 0,
  price_per_kwh numeric NOT NULL DEFAULT 1444.70,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create electric_transactions table
CREATE TABLE public.electric_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id uuid REFERENCES public.electric_meters(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  unit_number text NOT NULL,
  penghuni_name text,
  meter_number text NOT NULL,
  nominal numeric NOT NULL,
  price_per_kwh numeric NOT NULL,
  kwh_amount numeric NOT NULL,
  balance_before numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  transaction_date timestamp with time zone NOT NULL DEFAULT now(),
  operator_id uuid,
  operator_name text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.electric_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electric_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for electric_meters
CREATE POLICY "Admin can manage electric meters"
  ON public.electric_meters FOR ALL
  TO authenticated
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Staff can view electric meters"
  ON public.electric_meters FOR SELECT
  TO authenticated
  USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can insert electric meters"
  ON public.electric_meters FOR INSERT
  TO authenticated
  WITH CHECK (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can update electric meters"
  ON public.electric_meters FOR UPDATE
  TO authenticated
  USING (is_staff_or_above(auth.uid()))
  WITH CHECK (is_staff_or_above(auth.uid()));

-- RLS policies for electric_transactions
CREATE POLICY "Admin can manage electric transactions"
  ON public.electric_transactions FOR ALL
  TO authenticated
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Staff can view electric transactions"
  ON public.electric_transactions FOR SELECT
  TO authenticated
  USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can insert electric transactions"
  ON public.electric_transactions FOR INSERT
  TO authenticated
  WITH CHECK (is_staff_or_above(auth.uid()));

-- Users can view own unit transactions
CREATE POLICY "Users can view own electric transactions"
  ON public.electric_transactions FOR SELECT
  TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));
