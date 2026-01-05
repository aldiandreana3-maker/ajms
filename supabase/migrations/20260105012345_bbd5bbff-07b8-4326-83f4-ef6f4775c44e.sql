-- Add unit_number column to work_orders table for manual input
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS unit_number TEXT;

-- Add unit_number column to penghuni table for manual input
ALTER TABLE public.penghuni 
ADD COLUMN IF NOT EXISTS unit_number TEXT;