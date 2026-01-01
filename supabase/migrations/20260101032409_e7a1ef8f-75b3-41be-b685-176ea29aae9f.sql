-- Add recorded_by column to track who created the record
-- This allows penghuni to see their own submissions

-- Update SELECT policies to also allow users to see records they created (recorded_by = auth.uid())

-- For keluhan - add policy for users to see their own created records
DROP POLICY IF EXISTS "Penghuni can view own keluhan" ON public.keluhan;
CREATE POLICY "Penghuni can view own keluhan" 
ON public.keluhan 
FOR SELECT 
USING (
  (penghuni_id IN (SELECT penghuni.id FROM penghuni WHERE penghuni.user_id = auth.uid()))
  OR (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
  OR (handled_by = auth.uid())
);

-- For work_permits - users can see their created records via approved_by or add created_by tracking
DROP POLICY IF EXISTS "Penghuni can view own work permits" ON public.work_permits;
CREATE POLICY "Penghuni can view own work permits" 
ON public.work_permits 
FOR SELECT 
USING (
  (penghuni_id IN (SELECT penghuni.id FROM penghuni WHERE penghuni.user_id = auth.uid()))
  OR (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
);

-- For access_cards - already has good policy, just enhance
DROP POLICY IF EXISTS "Penghuni can view own access cards" ON public.access_cards;
CREATE POLICY "Penghuni can view own access cards" 
ON public.access_cards 
FOR SELECT 
USING (
  (penghuni_id IN (SELECT penghuni.id FROM penghuni WHERE penghuni.user_id = auth.uid()))
  OR (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
);

-- For goods_movement - enhance to include recorded_by
DROP POLICY IF EXISTS "Penghuni can view own goods movement" ON public.goods_movement;
CREATE POLICY "Penghuni can view own goods movement" 
ON public.goods_movement 
FOR SELECT 
USING (
  (penghuni_id IN (SELECT penghuni.id FROM penghuni WHERE penghuni.user_id = auth.uid()))
  OR (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
  OR (recorded_by = auth.uid())
);

-- For parking_subscriptions - enhance policy
DROP POLICY IF EXISTS "Penghuni can view own parking subscriptions" ON public.parking_subscriptions;
CREATE POLICY "Penghuni can view own parking subscriptions" 
ON public.parking_subscriptions 
FOR SELECT 
USING (
  (penghuni_id IN (SELECT penghuni.id FROM penghuni WHERE penghuni.user_id = auth.uid()))
  OR (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
);

-- For foreign_guest_reports - enhance to include recorded_by
DROP POLICY IF EXISTS "Penghuni can view own foreign guest reports" ON public.foreign_guest_reports;
CREATE POLICY "Penghuni can view own foreign guest reports" 
ON public.foreign_guest_reports 
FOR SELECT 
USING (
  (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
  OR (recorded_by = auth.uid())
);