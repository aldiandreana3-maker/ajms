-- Add INSERT policies for penghuni to submit their own data

-- Parking Subscriptions - Allow penghuni to insert their own
CREATE POLICY "Penghuni can insert own parking subscriptions" 
ON public.parking_subscriptions 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Parking Subscriptions - Allow penghuni to view own
CREATE POLICY "Penghuni can view own parking subscriptions" 
ON public.parking_subscriptions 
FOR SELECT 
USING (
  penghuni_id IN (SELECT id FROM public.penghuni WHERE user_id = auth.uid())
  OR unit_id = get_user_unit_id(auth.uid())
  OR is_staff_or_above(auth.uid())
);

-- Keluhan - Allow penghuni to insert their own complaints
CREATE POLICY "Penghuni can insert own keluhan" 
ON public.keluhan 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Keluhan - Allow penghuni to view own complaints
CREATE POLICY "Penghuni can view own keluhan" 
ON public.keluhan 
FOR SELECT 
USING (
  penghuni_id IN (SELECT id FROM public.penghuni WHERE user_id = auth.uid())
  OR unit_id = get_user_unit_id(auth.uid())
  OR is_staff_or_above(auth.uid())
);

-- Work Permits - Allow penghuni to insert their own
CREATE POLICY "Penghuni can insert own work permits" 
ON public.work_permits 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Work Permits - Allow penghuni to view own
CREATE POLICY "Penghuni can view own work permits" 
ON public.work_permits 
FOR SELECT 
USING (
  penghuni_id IN (SELECT id FROM public.penghuni WHERE user_id = auth.uid())
  OR unit_id = get_user_unit_id(auth.uid())
  OR is_staff_or_above(auth.uid())
);

-- Goods Movement - Allow penghuni to insert their own
CREATE POLICY "Penghuni can insert own goods movement" 
ON public.goods_movement 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Goods Movement - Allow penghuni to view own
CREATE POLICY "Penghuni can view own goods movement" 
ON public.goods_movement 
FOR SELECT 
USING (
  penghuni_id IN (SELECT id FROM public.penghuni WHERE user_id = auth.uid())
  OR unit_id = get_user_unit_id(auth.uid())
  OR is_staff_or_above(auth.uid())
);

-- Access Cards - Allow penghuni to insert their own
CREATE POLICY "Penghuni can insert own access cards" 
ON public.access_cards 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Access Cards - Allow penghuni to view own
CREATE POLICY "Penghuni can view own access cards" 
ON public.access_cards 
FOR SELECT 
USING (
  penghuni_id IN (SELECT id FROM public.penghuni WHERE user_id = auth.uid())
  OR unit_id = get_user_unit_id(auth.uid())
  OR is_staff_or_above(auth.uid())
);

-- Foreign Guest Reports - Allow penghuni to insert their own
CREATE POLICY "Penghuni can insert own foreign guest reports" 
ON public.foreign_guest_reports 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Foreign Guest Reports - Allow penghuni to view own
CREATE POLICY "Penghuni can view own foreign guest reports" 
ON public.foreign_guest_reports 
FOR SELECT 
USING (
  unit_id = get_user_unit_id(auth.uid())
  OR is_staff_or_above(auth.uid())
);