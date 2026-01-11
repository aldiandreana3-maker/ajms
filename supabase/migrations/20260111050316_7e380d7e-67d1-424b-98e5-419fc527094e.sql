-- Add foreign key constraints to packages table for recorded_by and picked_up_by
ALTER TABLE public.packages
ADD CONSTRAINT packages_recorded_by_fkey 
FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.packages
ADD CONSTRAINT packages_picked_up_by_fkey 
FOREIGN KEY (picked_up_by) REFERENCES public.profiles(id) ON DELETE SET NULL;