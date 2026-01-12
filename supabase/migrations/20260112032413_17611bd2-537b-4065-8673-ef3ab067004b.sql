-- Fix packages table foreign keys for data preservation

-- 1. packages: change unit_id to SET NULL
ALTER TABLE public.packages 
DROP CONSTRAINT IF EXISTS packages_unit_id_fkey;

ALTER TABLE public.packages 
ADD CONSTRAINT packages_unit_id_fkey 
FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;