
-- Add monthly_sc and monthly_sf columns to store exact values
ALTER TABLE public.bill_rates ADD COLUMN IF NOT EXISTS monthly_sc numeric DEFAULT 0;
ALTER TABLE public.bill_rates ADD COLUMN IF NOT EXISTS monthly_sf numeric DEFAULT 0;
