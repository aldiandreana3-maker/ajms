
-- Add address column to penghuni table for billing statement
ALTER TABLE public.penghuni ADD COLUMN IF NOT EXISTS address text;
