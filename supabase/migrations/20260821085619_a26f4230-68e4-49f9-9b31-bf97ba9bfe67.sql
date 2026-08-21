DROP POLICY IF EXISTS "Users can view own unit parking payment history" ON public.parking_payment_history;
CREATE POLICY "Users can view own unit or own uploaded parking payments"
ON public.parking_payment_history FOR SELECT
USING (
  created_by = auth.uid()
  OR unit_id IN (SELECT get_user_unit_ids(auth.uid()))
  OR public.user_owns_unit_number(auth.uid(), unit_number)
  OR public.is_staff_or_above(auth.uid())
);