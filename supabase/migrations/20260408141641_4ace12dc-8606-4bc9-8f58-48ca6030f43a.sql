-- Allow master_dev full access to system_payments
CREATE POLICY "Master dev can manage payments"
ON public.system_payments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master_dev'::app_role))
WITH CHECK (has_role(auth.uid(), 'master_dev'::app_role));