CREATE TABLE public.parking_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid,
  vehicle_number text,
  unit_number text,
  unit_id uuid,
  owner_name text,
  period_month smallint NOT NULL,
  period_year smallint NOT NULL,
  period_label text NOT NULL,
  period_date date NOT NULL,
  nominal numeric NOT NULL DEFAULT 0,
  payment_method text,
  payment_proof_url text,
  payment_date timestamptz,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, period_year, period_month)
);

CREATE INDEX idx_pph_subscription ON public.parking_payment_history(subscription_id);
CREATE INDEX idx_pph_period ON public.parking_payment_history(period_year, period_month);
CREATE INDEX idx_pph_unit ON public.parking_payment_history(unit_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_payment_history TO authenticated;
GRANT ALL ON public.parking_payment_history TO service_role;

ALTER TABLE public.parking_payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage parking payment history"
ON public.parking_payment_history
FOR ALL
TO authenticated
USING (is_staff_or_above(auth.uid()))
WITH CHECK (is_staff_or_above(auth.uid()));

CREATE POLICY "Users can view own unit parking payment history"
ON public.parking_payment_history
FOR SELECT
TO authenticated
USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())) OR is_staff_or_above(auth.uid()));

CREATE POLICY "Users can insert own parking payment history"
ON public.parking_payment_history
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid() OR is_staff_or_above(auth.uid()));

CREATE TRIGGER update_parking_payment_history_updated_at
BEFORE UPDATE ON public.parking_payment_history
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();