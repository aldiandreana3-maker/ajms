CREATE POLICY "Users can update own parking payment history"
ON public.parking_payment_history
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR unit_id IN (SELECT get_user_unit_ids(auth.uid())) OR is_staff_or_above(auth.uid()))
WITH CHECK (created_by = auth.uid() OR unit_id IN (SELECT get_user_unit_ids(auth.uid())) OR is_staff_or_above(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own parking payment history" ON public.parking_payment_history;
CREATE POLICY "Users can insert own parking payment history"
ON public.parking_payment_history
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid() OR unit_id IN (SELECT get_user_unit_ids(auth.uid())) OR is_staff_or_above(auth.uid()));