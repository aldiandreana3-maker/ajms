CREATE POLICY "Penghuni can update own parking subscriptions"
ON public.parking_subscriptions
FOR UPDATE
TO authenticated
USING (
  (penghuni_id IN (SELECT id FROM public.penghuni WHERE user_id = auth.uid()))
  OR (unit_id IN (SELECT public.get_user_unit_ids(auth.uid())))
  OR (created_by = auth.uid())
)
WITH CHECK (
  (penghuni_id IN (SELECT id FROM public.penghuni WHERE user_id = auth.uid()))
  OR (unit_id IN (SELECT public.get_user_unit_ids(auth.uid())))
  OR (created_by = auth.uid())
);