
-- Clean all existing bills data (user confirmed fresh start)
DELETE FROM public.bills;

-- Add 'partial' to payment_status enum
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'partial';

-- Add quarterly columns to bills table
ALTER TABLE public.bills 
  ADD COLUMN IF NOT EXISTS quarter_start date,
  ADD COLUMN IF NOT EXISTS quarter_end date,
  ADD COLUMN IF NOT EXISTS quarter_label text,
  ADD COLUMN IF NOT EXISTS sc_monthly numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sf_monthly numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sc_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sf_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;

-- Make bill_type nullable with default for backward compat
ALTER TABLE public.bills ALTER COLUMN bill_type SET DEFAULT 'ipl';

-- Create bill_payments table for monthly payment details
CREATE TABLE public.bill_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  month_number smallint NOT NULL CHECK (month_number BETWEEN 1 AND 3),
  month_label text NOT NULL,
  month_date date NOT NULL,
  sc_amount numeric NOT NULL DEFAULT 0,
  sf_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  paid_amount numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bill_id, month_number)
);

-- Enable RLS on bill_payments
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

-- RLS: Admin can manage bill_payments
CREATE POLICY "Admin can manage bill_payments"
  ON public.bill_payments FOR ALL
  USING (is_admin_or_above(auth.uid()));

-- RLS: Users can view own unit bill_payments
CREATE POLICY "Users can view own bill_payments"
  ON public.bill_payments FOR SELECT
  USING (
    bill_id IN (
      SELECT id FROM public.bills 
      WHERE unit_id IN (SELECT get_user_unit_ids(auth.uid()))
    )
    OR is_staff_or_above(auth.uid())
  );

-- RLS: Users can update own bill_payments (for self-payment)
CREATE POLICY "Users can update own bill_payments"
  ON public.bill_payments FOR UPDATE
  USING (
    bill_id IN (
      SELECT id FROM public.bills 
      WHERE unit_id IN (SELECT get_user_unit_ids(auth.uid()))
    )
  )
  WITH CHECK (
    bill_id IN (
      SELECT id FROM public.bills 
      WHERE unit_id IN (SELECT get_user_unit_ids(auth.uid()))
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_bill_payments_updated_at
  BEFORE UPDATE ON public.bill_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
