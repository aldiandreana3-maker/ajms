DROP POLICY IF EXISTS "Users can insert own parking payment history" ON public.parking_payment_history;
DROP POLICY IF EXISTS "Users can update own parking payment history" ON public.parking_payment_history;

CREATE POLICY "Authenticated can insert parking payment history"
ON public.parking_payment_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.parking_subscriptions ps WHERE ps.id = subscription_id)
);

CREATE POLICY "Authenticated can update parking payment history"
ON public.parking_payment_history
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.parking_subscriptions ps WHERE ps.id = subscription_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.parking_subscriptions ps WHERE ps.id = subscription_id)
);