-- Fix foreign keys to prevent data deletion when user/penghuni is deleted
-- Change CASCADE to SET NULL for data preservation

-- 1. access_cards: change penghuni_id from CASCADE to SET NULL
ALTER TABLE public.access_cards 
DROP CONSTRAINT IF EXISTS access_cards_penghuni_id_fkey;

ALTER TABLE public.access_cards 
ADD CONSTRAINT access_cards_penghuni_id_fkey 
FOREIGN KEY (penghuni_id) REFERENCES penghuni(id) ON DELETE SET NULL;

-- 2. access_cards: change created_by to SET NULL
ALTER TABLE public.access_cards 
DROP CONSTRAINT IF EXISTS access_cards_created_by_fkey;

ALTER TABLE public.access_cards 
ADD CONSTRAINT access_cards_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. parking_subscriptions: change penghuni_id from CASCADE to SET NULL
ALTER TABLE public.parking_subscriptions 
DROP CONSTRAINT IF EXISTS parking_subscriptions_penghuni_id_fkey;

ALTER TABLE public.parking_subscriptions 
ADD CONSTRAINT parking_subscriptions_penghuni_id_fkey 
FOREIGN KEY (penghuni_id) REFERENCES penghuni(id) ON DELETE SET NULL;

-- 4. parking_subscriptions: change created_by to SET NULL
ALTER TABLE public.parking_subscriptions 
DROP CONSTRAINT IF EXISTS parking_subscriptions_created_by_fkey;

ALTER TABLE public.parking_subscriptions 
ADD CONSTRAINT parking_subscriptions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. keluhan: change created_by to SET NULL
ALTER TABLE public.keluhan 
DROP CONSTRAINT IF EXISTS keluhan_created_by_fkey;

ALTER TABLE public.keluhan 
ADD CONSTRAINT keluhan_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. work_permits: change created_by to SET NULL (if exists)
ALTER TABLE public.work_permits 
DROP CONSTRAINT IF EXISTS work_permits_created_by_fkey;

ALTER TABLE public.work_permits 
ADD CONSTRAINT work_permits_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 7. work_permits: add proper constraints for other fields
ALTER TABLE public.work_permits 
DROP CONSTRAINT IF EXISTS work_permits_penghuni_id_fkey;

ALTER TABLE public.work_permits 
ADD CONSTRAINT work_permits_penghuni_id_fkey 
FOREIGN KEY (penghuni_id) REFERENCES penghuni(id) ON DELETE SET NULL;

ALTER TABLE public.work_permits 
DROP CONSTRAINT IF EXISTS work_permits_unit_id_fkey;

ALTER TABLE public.work_permits 
ADD CONSTRAINT work_permits_unit_id_fkey 
FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- 8. dashboard_settings: change updated_by to SET NULL
ALTER TABLE public.dashboard_settings 
DROP CONSTRAINT IF EXISTS dashboard_settings_updated_by_fkey;

ALTER TABLE public.dashboard_settings 
ADD CONSTRAINT dashboard_settings_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 9. foreign_guest_reports: add SET NULL for recorded_by and unit_id
ALTER TABLE public.foreign_guest_reports 
DROP CONSTRAINT IF EXISTS foreign_guest_reports_recorded_by_fkey;

ALTER TABLE public.foreign_guest_reports 
ADD CONSTRAINT foreign_guest_reports_recorded_by_fkey 
FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.foreign_guest_reports 
DROP CONSTRAINT IF EXISTS foreign_guest_reports_unit_id_fkey;

ALTER TABLE public.foreign_guest_reports 
ADD CONSTRAINT foreign_guest_reports_unit_id_fkey 
FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- 10. bills: change unit_id from CASCADE to SET NULL
ALTER TABLE public.bills 
DROP CONSTRAINT IF EXISTS bills_unit_id_fkey;

ALTER TABLE public.bills 
ADD CONSTRAINT bills_unit_id_fkey 
FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;