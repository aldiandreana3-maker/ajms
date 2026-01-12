-- Add name columns to packages table to preserve names even if user is deleted
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS recorded_by_name TEXT,
ADD COLUMN IF NOT EXISTS picked_up_by_name TEXT;

-- Update RLS for profiles to allow staff to view profile names
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_staff_or_above(auth.uid()));