-- Add text columns for penghuni_name, unit_number, and phone to all kepenghunian tables

-- parking_subscriptions
ALTER TABLE public.parking_subscriptions 
ADD COLUMN IF NOT EXISTS penghuni_name text,
ADD COLUMN IF NOT EXISTS unit_number text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS agent_name text,
ADD COLUMN IF NOT EXISTS member_card text,
ADD COLUMN IF NOT EXISTS request_type text,
ADD COLUMN IF NOT EXISTS period_type text;

-- keluhan
ALTER TABLE public.keluhan 
ADD COLUMN IF NOT EXISTS penghuni_name text,
ADD COLUMN IF NOT EXISTS unit_number text,
ADD COLUMN IF NOT EXISTS phone text;

-- work_permits
ALTER TABLE public.work_permits 
ADD COLUMN IF NOT EXISTS penghuni_name text,
ADD COLUMN IF NOT EXISTS unit_number text,
ADD COLUMN IF NOT EXISTS phone text;

-- goods_movement
ALTER TABLE public.goods_movement 
ADD COLUMN IF NOT EXISTS penghuni_name text,
ADD COLUMN IF NOT EXISTS unit_number text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS rental_status text;

-- access_cards
ALTER TABLE public.access_cards 
ADD COLUMN IF NOT EXISTS penghuni_name text,
ADD COLUMN IF NOT EXISTS unit_number text,
ADD COLUMN IF NOT EXISTS request_type text,
ADD COLUMN IF NOT EXISTS quantity_requested integer DEFAULT 1;

-- foreign_guest_reports
ALTER TABLE public.foreign_guest_reports 
ADD COLUMN IF NOT EXISTS unit_number text;