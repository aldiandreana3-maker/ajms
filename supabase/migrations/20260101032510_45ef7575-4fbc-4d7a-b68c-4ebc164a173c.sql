-- Add created_by column to access_cards table for tracking
ALTER TABLE public.access_cards ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Add created_by column to parking_subscriptions table for tracking
ALTER TABLE public.parking_subscriptions ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Add created_by column to keluhan table for tracking
ALTER TABLE public.keluhan ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Add created_by column to work_permits table for tracking
ALTER TABLE public.work_permits ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Update SELECT policies to include created_by check

-- For keluhan
DROP POLICY IF EXISTS "Penghuni can view own keluhan" ON public.keluhan;
CREATE POLICY "Penghuni can view own keluhan" 
ON public.keluhan 
FOR SELECT 
USING (
  (penghuni_id IN (SELECT penghuni.id FROM penghuni WHERE penghuni.user_id = auth.uid()))
  OR (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
  OR (created_by = auth.uid())
);

-- For work_permits
DROP POLICY IF EXISTS "Penghuni can view own work permits" ON public.work_permits;
CREATE POLICY "Penghuni can view own work permits" 
ON public.work_permits 
FOR SELECT 
USING (
  (penghuni_id IN (SELECT penghuni.id FROM penghuni WHERE penghuni.user_id = auth.uid()))
  OR (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
  OR (created_by = auth.uid())
);

-- For access_cards
DROP POLICY IF EXISTS "Penghuni can view own access cards" ON public.access_cards;
CREATE POLICY "Penghuni can view own access cards" 
ON public.access_cards 
FOR SELECT 
USING (
  (penghuni_id IN (SELECT penghuni.id FROM penghuni WHERE penghuni.user_id = auth.uid()))
  OR (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
  OR (created_by = auth.uid())
);

-- For parking_subscriptions
DROP POLICY IF EXISTS "Penghuni can view own parking subscriptions" ON public.parking_subscriptions;
CREATE POLICY "Penghuni can view own parking subscriptions" 
ON public.parking_subscriptions 
FOR SELECT 
USING (
  (penghuni_id IN (SELECT penghuni.id FROM penghuni WHERE penghuni.user_id = auth.uid()))
  OR (unit_id = get_user_unit_id(auth.uid()))
  OR is_staff_or_above(auth.uid())
  OR (created_by = auth.uid())
);