-- Allow penghuni to update payment_status on their own unit bills (self-confirm)
CREATE POLICY "Users can update own unit bill payment"
ON public.bills
FOR UPDATE
TO authenticated
USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())))
WITH CHECK (unit_id IN (SELECT get_user_unit_ids(auth.uid())));
