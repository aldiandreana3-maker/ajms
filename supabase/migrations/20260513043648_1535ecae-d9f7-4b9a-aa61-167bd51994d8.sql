
-- Allow staff (incl. engineering) to insert bill_payments so water bills auto-attach
DROP POLICY IF EXISTS "Staff can insert bill_payments" ON public.bill_payments;
CREATE POLICY "Staff can insert bill_payments"
ON public.bill_payments
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_above(auth.uid()));

-- Backfill: create 1 bill_payments row for every existing 'air' bill that has none
INSERT INTO public.bill_payments (bill_id, month_number, month_label, month_date, sc_amount, sf_amount, total_amount)
SELECT b.id, 1,
       'Tagihan Air ' || COALESCE(b.quarter_label, to_char(b.billing_period, 'Mon YYYY')),
       b.billing_period,
       0, 0, b.total_amount
FROM public.bills b
LEFT JOIN public.bill_payments bp ON bp.bill_id = b.id
WHERE b.bill_type = 'air' AND bp.id IS NULL;
